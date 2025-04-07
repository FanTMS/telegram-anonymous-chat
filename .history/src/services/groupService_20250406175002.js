import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    increment
} from 'firebase/firestore';
import { db } from '../firebase';
import Group from '../models/Group';
import { safeFirestoreQuery } from '../utils/firebaseUtils';

/**
 * Создает новую группу
 * @param {Object} groupData - Данные группы
 * @param {string} userId - ID создателя группы
 * @returns {Promise<string>} ID созданной группы
 */
export const createGroup = async (groupData, userId) => {
    try {
        const timestamp = new Date().toISOString();

        // Создаем объект новой группы
        const newGroup = new Group({
            ...groupData,
            createdAt: timestamp,
            lastActivity: timestamp,
            createdBy: userId,
            members: {
                [userId]: {
                    role: 'admin',
                    joinedAt: timestamp,
                    isActive: true
                }
            },
            memberCount: 1
        });

        // Добавляем группу в базу данных
        const groupRef = await safeFirestoreQuery(() =>
            addDoc(collection(db, "groups"), newGroup.toFirestore())
        );

        console.log(`Создана новая группа с ID: ${groupRef.id}`);

        // Создаем первое системное сообщение в группе
        await safeFirestoreQuery(() =>
            addDoc(collection(db, "groupMessages"), {
                groupId: groupRef.id,
                senderId: "system",
                senderName: "Система",
                text: `Группа "${groupData.name}" создана`,
                createdAt: timestamp,
                type: "system",
                isDeleted: false
            })
        );

        // Добавляем группу в список групп пользователя
        await safeFirestoreQuery(() =>
            updateDoc(doc(db, "users", userId), {
                groups: arrayUnion(groupRef.id),
                lastActivity: timestamp
            })
        );

        return groupRef.id;
    } catch (error) {
        console.error("Ошибка при создании группы:", error);
        throw error;
    }
};

/**
 * Получает информацию о группе по ID
 * @param {string} groupId - ID группы
 * @returns {Promise<Group|null>} - Объект группы или null
 */
export const getGroupById = async (groupId) => {
    try {
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await safeFirestoreQuery(() => getDoc(groupRef));

        if (!groupDoc.exists()) {
            console.warn(`Группа с ID ${groupId} не найдена`);
            return null;
        }

        return Group.fromFirestore(groupDoc);
    } catch (error) {
        console.error(`Ошибка при получении группы с ID ${groupId}:`, error);
        throw error;
    }
};

/**
 * Получает список публичных групп
 * @param {number} limit - Ограничение количества результатов
 * @returns {Promise<Array<Group>>} Массив объектов групп
 */
export const getPublicGroups = async (limitCount = 20) => {
    try {
        const groupsQuery = query(
            collection(db, "groups"),
            where("isPublic", "==", true),
            orderBy("memberCount", "desc"),
            orderBy("lastActivity", "desc"),
            limit(limitCount)
        );

        const groupsSnapshot = await safeFirestoreQuery(() => getDocs(groupsQuery));

        return groupsSnapshot.docs.map(doc => Group.fromFirestore(doc));
    } catch (error) {
        console.error("Ошибка при получении списка публичных групп:", error);
        throw error;
    }
};

/**
 * Получает группы, в которых пользователь является участником
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} - Массив групп
 */
export const getUserGroups = async (userId) => {
    try {
        if (!userId) {
            console.warn('getUserGroups: userId не определен');
            return [];
        }

        // Создаем путь к полю members, который использует userId как ключ
        const memberField = `members.${userId}`;
        
        // Используем более простой запрос без сортировки по нескольким полям для избежания необходимости создания индекса
        const groupsQuery = query(
            collection(db, "groups"),
            where(memberField, "!=", null)
        );

        const querySnapshot = await safeFirestoreQuery(() => getDocs(groupsQuery));
        
        // Проверка на существование querySnapshot перед доступом к docs
        if (!querySnapshot) {
            console.warn('getUserGroups: querySnapshot равен null');
            return [];
        }
        
        // Сортировка на стороне клиента вместо использования orderBy
        const groups = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => {
            // Сортировка по lastActivity (от новых к старым)
            const timeA = a.lastActivity?.toMillis ? a.lastActivity.toMillis() : 0;
            const timeB = b.lastActivity?.toMillis ? b.lastActivity.toMillis() : 0;
            return timeB - timeA;
        });
        
        return groups;
    } catch (error) {
        console.error(`Ошибка при получении групп пользователя ${userId}:`, error);
        // Возвращаем пустой массив вместо выбрасывания исключения
        return [];
    }
};

/**
 * Присоединяется к группе
 * @param {string} groupId - ID группы
 * @param {string} userId - ID пользователя
 * @returns {Promise<boolean>} true в случае успеха
 */
export const joinGroup = async (groupId, userId) => {
    try {
        const timestamp = new Date().toISOString();
        const groupRef = doc(db, "groups", groupId);

        // Проверяем существование группы
        const groupDoc = await safeFirestoreQuery(() => getDoc(groupRef));

        if (!groupDoc.exists()) {
            throw new Error(`Группа с ID ${groupId} не найдена`);
        }

        const groupData = groupDoc.data();

        // Проверяем, является ли группа публичной
        if (!groupData.isPublic) {
            throw new Error("Нельзя присоединиться к приватной группе без приглашения");
        }

        // Проверяем, не состоит ли пользователь уже в группе
        if (groupData.members && groupData.members[userId]) {
            console.warn(`Пользователь ${userId} уже является членом группы ${groupId}`);
            return true;
        }

        // Добавляем пользователя в группу
        await safeFirestoreQuery(() =>
            updateDoc(groupRef, {
                [`members.${userId}`]: {
                    role: 'member',
                    joinedAt: timestamp,
                    isActive: true
                },
                memberCount: increment(1),
                lastActivity: timestamp
            })
        );

        // Добавляем группу в список групп пользователя
        await safeFirestoreQuery(() =>
            updateDoc(doc(db, "users", userId), {
                groups: arrayUnion(groupId),
                lastActivity: timestamp
            })
        );

        // Добавляем системное сообщение о присоединении пользователя
        await safeFirestoreQuery(() =>
            addDoc(collection(db, "groupMessages"), {
                groupId: groupId,
                senderId: "system",
                senderName: "Система",
                text: `Пользователь присоединился к группе`,
                createdAt: timestamp,
                type: "system",
                isDeleted: false,
                userId: userId // Добавляем ID пользователя для отображения имени
            })
        );

        return true;
    } catch (error) {
        console.error(`Ошибка при присоединении к группе ${groupId}:`, error);
        throw error;
    }
};

/**
 * Покидает группу
 * @param {string} groupId - ID группы
 * @param {string} userId - ID пользователя
 * @returns {Promise<boolean>} true в случае успеха
 */
export const leaveGroup = async (groupId, userId) => {
    try {
        const timestamp = new Date().toISOString();
        const groupRef = doc(db, "groups", groupId);

        // Проверяем существование группы
        const groupDoc = await safeFirestoreQuery(() => getDoc(groupRef));

        if (!groupDoc.exists()) {
            throw new Error(`Группа с ID ${groupId} не найдена`);
        }

        const groupData = groupDoc.data();

        // Проверяем, состоит ли пользователь в группе
        if (!groupData.members || !groupData.members[userId]) {
            console.warn(`Пользователь ${userId} не является членом группы ${groupId}`);
            return true;
        }

        // Проверяем, не является ли пользователь единственным администратором
        if (groupData.members[userId].role === 'admin') {
            const adminCount = Object.entries(groupData.members).filter(
                ([_, member]) => member.role === 'admin'
            ).length;

            if (adminCount === 1) {
                throw new Error("Вы не можете покинуть группу, так как вы единственный администратор");
            }
        }

        // Удаляем пользователя из группы
        const memberUpdate = {
            [`members.${userId}`]: {
                role: groupData.members[userId].role,
                joinedAt: groupData.members[userId].joinedAt,
                isActive: false,
                leftAt: timestamp
            },
            memberCount: increment(-1),
            lastActivity: timestamp
        };

        await safeFirestoreQuery(() => updateDoc(groupRef, memberUpdate));

        // Удаляем группу из списка групп пользователя
        await safeFirestoreQuery(() =>
            updateDoc(doc(db, "users", userId), {
                groups: arrayRemove(groupId),
                lastActivity: timestamp
            })
        );

        // Добавляем системное сообщение о выходе пользователя
        await safeFirestoreQuery(() =>
            addDoc(collection(db, "groupMessages"), {
                groupId: groupId,
                senderId: "system",
                senderName: "Система",
                text: `Пользователь покинул группу`,
                createdAt: timestamp,
                type: "system",
                isDeleted: false,
                userId: userId // Добавляем ID пользователя для отображения имени
            })
        );

        return true;
    } catch (error) {
        console.error(`Ошибка при выходе из группы ${groupId}:`, error);
        throw error;
    }
};

/**
 * Отправляет сообщение в группу
 * @param {string} groupId - ID группы
 * @param {string} userId - ID отправителя
 * @param {string} text - Текст сообщения
 * @param {string} userName - Имя отправителя (для анонимных групп - псевдоним)
 * @returns {Promise<string>} ID созданного сообщения
 */
export const sendGroupMessage = async (groupId, userId, text, userName) => {
    try {
        const timestamp = new Date().toISOString();

        // Проверяем существование группы
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await safeFirestoreQuery(() => getDoc(groupRef));

        if (!groupDoc.exists()) {
            throw new Error(`Группа с ID ${groupId} не найдена`);
        }

        const groupData = groupDoc.data();

        // Проверяем, состоит ли пользователь в группе
        if (!groupData.members || !groupData.members[userId] || !groupData.members[userId].isActive) {
            throw new Error("Вы не являетесь членом этой группы");
        }

        // Создаем сообщение
        const messageData = {
            groupId,
            senderId: userId,
            senderName: groupData.isAnonymous ? userName || "Аноним" : userName,
            text,
            createdAt: timestamp,
            type: "message",
            isDeleted: false,
            isAnonymous: groupData.isAnonymous
        };

        const messageRef = await safeFirestoreQuery(() =>
            addDoc(collection(db, "groupMessages"), messageData)
        );

        // Обновляем время последней активности в группе
        await safeFirestoreQuery(() =>
            updateDoc(groupRef, {
                lastActivity: timestamp,
                lastMessage: {
                    text: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
                    senderId: userId,
                    senderName: messageData.senderName,
                    timestamp
                }
            })
        );

        return messageRef.id;
    } catch (error) {
        console.error(`Ошибка при отправке сообщения в группу ${groupId}:`, error);
        throw error;
    }
};

/**
 * Получает сообщения группы
 * @param {string} groupId - ID группы
 * @param {number} limitCount - Ограничение количества сообщений
 * @returns {Promise<Array<Object>>} Массив сообщений
 */
export const getGroupMessages = async (groupId, limitCount = 50) => {
    try {
        const messagesQuery = query(
            collection(db, "groupMessages"),
            where("groupId", "==", groupId),
            where("isDeleted", "==", false),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );

        const messagesSnapshot = await safeFirestoreQuery(() => getDocs(messagesQuery));

        return messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).reverse();
    } catch (error) {
        console.error(`Ошибка при получении сообщений группы ${groupId}:`, error);
        throw error;
    }
};

/**
 * Обновляет информацию о группе
 * @param {string} groupId - ID группы
 * @param {Object} groupData - Данные для обновления
 * @param {string} userId - ID пользователя, выполняющего обновление
 * @returns {Promise<boolean>} true в случае успеха
 */
export const updateGroup = async (groupId, groupData, userId) => {
    try {
        // Проверяем существование группы
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await safeFirestoreQuery(() => getDoc(groupRef));

        if (!groupDoc.exists()) {
            throw new Error(`Группа с ID ${groupId} не найдена`);
        }

        const currentGroupData = groupDoc.data();

        // Проверяем права пользователя (только админ может изменять группу)
        if (!currentGroupData.members ||
            !currentGroupData.members[userId] ||
            currentGroupData.members[userId].role !== 'admin') {
            throw new Error("У вас нет прав для изменения этой группы");
        }

        // Проверяем, какие поля можно обновить
        const allowedFields = ['name', 'description', 'isPublic', 'isAnonymous', 'avatar', 'tags'];
        const updateData = {};

        allowedFields.forEach(field => {
            if (groupData[field] !== undefined) {
                updateData[field] = groupData[field];
            }
        });

        // Если нет данных для обновления
        if (Object.keys(updateData).length === 0) {
            return true;
        }

        // Обновляем время последней активности
        updateData.lastActivity = new Date().toISOString();

        // Применяем обновления
        await safeFirestoreQuery(() => updateDoc(groupRef, updateData));

        return true;
    } catch (error) {
        console.error(`Ошибка при обновлении группы ${groupId}:`, error);
        throw error;
    }
};

/**
 * Поиск групп по названию или тегам
 * @param {string} query - Поисковый запрос
 * @param {number} limitCount - Ограничение количества результатов
 * @returns {Promise<Array<Group>>} Массив объектов групп
 */
export const searchGroups = async (query, limitCount = 20) => {
    try {
        const searchQuery = query.toLowerCase().trim();

        // Поиск возможен только среди публичных групп
        const groupsQuery = query(
            collection(db, "groups"),
            where("isPublic", "==", true),
            orderBy("name"),
            limit(limitCount)
        );

        const groupsSnapshot = await safeFirestoreQuery(() => getDocs(groupsQuery));

        // Фильтруем результаты на клиенте
        return groupsSnapshot.docs
            .map(doc => Group.fromFirestore(doc))
            .filter(group => {
                const nameMatch = group.name.toLowerCase().includes(searchQuery);
                const descriptionMatch = group.description.toLowerCase().includes(searchQuery);
                const tagMatch = group.tags && group.tags.some(tag =>
                    tag.toLowerCase().includes(searchQuery)
                );

                return nameMatch || descriptionMatch || tagMatch;
            });
    } catch (error) {
        console.error(`Ошибка при поиске групп по запросу "${query}":`, error);
        throw error;
    }
};

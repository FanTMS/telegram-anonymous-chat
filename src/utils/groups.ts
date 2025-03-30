import { User, getCurrentUser, getUsers } from './user'
import { getItem, setItem, getAllItems, removeItem } from './dbService';

// Типы участников группы
export enum GroupMemberRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member'
}

// Интерфейс для участника группы
export interface GroupMember {
  userId: string
  joinedAt: number
  role: GroupMemberRole
  isAnonymous: boolean
  anonymousName?: string
}

// Интерфейс для сообщения в группе
export interface GroupMessage {
  id: string
  groupId: string
  senderId: string
  text: string
  timestamp: number
  isAnonymous: boolean
  senderName?: string
  isSystem?: boolean
}

// Интерфейс для группового чата
export interface Group {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
  createdBy: string
  isAnonymous: boolean
  isPrivate: boolean
  memberCount: number
  maxMembers: number
  tags: string[]
  avatarUrl?: string
}

// Получить список всех групп
export const getAllGroups = async (): Promise<Group[]> => {
  try {
    const groups = await getAllItems('groups', {});
    return groups.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Ошибка при получении списка групп:', error);
    return [];
  }
}

// Создать новую группу
export const createGroup = async (
  name: string,
  description = '',
  isAnonymous = false,
  isPrivate = false,
  tags: string[] = [],
  avatarUrl?: string
): Promise<Group | null> => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось создать группу: пользователь не авторизован');
      return null;
    }

    const groupId = `group_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();

    // Создаем группу
    const group: Group = {
      id: groupId,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.id,
      isAnonymous,
      isPrivate,
      memberCount: 1, // создатель уже в группе
      maxMembers: 100, // максимум по умолчанию
      tags,
      avatarUrl
    };

    // Сохраняем группу
    await setItem(`groups.${groupId}`, group);

    // Добавляем создателя как администратора группы
    const member: GroupMember = {
      userId: currentUser.id,
      joinedAt: now,
      role: GroupMemberRole.ADMIN,
      isAnonymous: false // создатель по умолчанию не анонимен
    };

    // Сохраняем члена группы
    const groupMembers: GroupMember[] = [member];
    await setItem(`group_members.${groupId}`, groupMembers);

    // Создаем системное сообщение о создании группы
    const systemMessage: GroupMessage = {
      id: `msg_${Date.now()}`,
      groupId,
      senderId: 'system',
      text: `Группа "${name}" создана.`,
      timestamp: now,
      isAnonymous: false,
      isSystem: true
    };

    // Сохраняем сообщение
    const messages: GroupMessage[] = [systemMessage];
    await setItem(`group_messages.${groupId}`, messages);

    // Добавляем группу в список групп пользователя
    await addGroupToUsersList(currentUser.id, groupId);

    return group;
  } catch (error) {
    console.error('Ошибка при создании группы:', error);
    return null;
  }
}

// Присоединиться к группе
export const joinGroup = async (
  groupId: string,
  isAnonymous = false,
  anonymousName?: string
): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось присоединиться к группе: пользователь не авторизован');
      return false;
    }

    // Получаем данные о группе
    const group = await getItem(`groups.${groupId}`);
    if (!group) {
      console.error(`Группа ${groupId} не найдена`);
      return false;
    }

    // Проверяем, не достигнуто ли максимальное количество участников
    if (group.memberCount >= group.maxMembers) {
      console.error(`Группа ${groupId} заполнена`);
      return false;
    }

    // Получаем список участников группы
    const members: GroupMember[] = await getItem(`group_members.${groupId}`) || [];

    // Проверяем, не является ли пользователь уже участником группы
    const existingMember = members.find(m => m.userId === currentUser.id);
    if (existingMember) {
      console.log(`Пользователь ${currentUser.id} уже является участником группы ${groupId}`);
      return true;
    }

    // Добавляем пользователя в группу
    const member: GroupMember = {
      userId: currentUser.id,
      joinedAt: Date.now(),
      role: GroupMemberRole.MEMBER,
      isAnonymous,
      anonymousName
    };

    members.push(member);

    // Обновляем список участников
    await setItem(`group_members.${groupId}`, members);

    // Обновляем количество участников группы
    group.memberCount = members.length;
    group.updatedAt = Date.now();
    await setItem(`groups.${groupId}`, group);

    // Добавляем группу в список групп пользователя
    await addGroupToUsersList(currentUser.id, groupId);

    // Создаем системное сообщение о присоединении пользователя
    const now = Date.now();
    const userName = isAnonymous
      ? (anonymousName || 'Анонимный пользователь')
      : currentUser.name;

    const systemMessage: GroupMessage = {
      id: `msg_${now}`,
      groupId,
      senderId: 'system',
      text: `${userName} присоединился к группе.`,
      timestamp: now,
      isAnonymous: false,
      isSystem: true
    };

    // Получаем текущие сообщения группы
    const messages: GroupMessage[] = await getItem(`group_messages.${groupId}`) || [];

    // Добавляем системное сообщение
    messages.push(systemMessage);
    await setItem(`group_messages.${groupId}`, messages);

    return true;
  } catch (error) {
    console.error('Ошибка при присоединении к группе:', error);
    return false;
  }
}

// Покинуть группу
export const leaveGroup = async (groupId: string): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось покинуть группу: пользователь не авторизован');
      return false;
    }

    // Получаем данные о группе
    const group = await getItem(`groups.${groupId}`);
    if (!group) {
      console.error(`Группа ${groupId} не найдена`);
      return false;
    }

    // Получаем список участников группы
    const members: GroupMember[] = await getItem(`group_members.${groupId}`);
    if (!members) {
      console.error(`Список участников группы ${groupId} не найден`);
      return false;
    }

    // Ищем участника для удаления
    const memberIndex = members.findIndex(m => m.userId === currentUser.id);
    if (memberIndex === -1) {
      console.error(`Пользователь ${currentUser.id} не является участником группы ${groupId}`);
      return false;
    }

    // Если пользователь - единственный администратор, нельзя покинуть группу
    const isAdmin = members[memberIndex].role === GroupMemberRole.ADMIN;
    const hasOtherAdmins = members.filter(m => m.role === GroupMemberRole.ADMIN && m.userId !== currentUser.id).length > 0;

    if (isAdmin && !hasOtherAdmins && members.length > 1) {
      console.error('Нельзя покинуть группу: вы единственный администратор');
      return false;
    }

    // Если пользователь - единственный участник, удаляем группу
    if (members.length === 1) {
      // Удаляем группу
      await removeItem(`groups.${groupId}`);
      await removeItem(`group_members.${groupId}`);
      await removeItem(`group_messages.${groupId}`);

      // Удаляем группу из списка групп пользователя
      await removeGroupFromUsersList(currentUser.id, groupId);

      return true;
    }

    // Удаляем пользователя из группы
    const member = members[memberIndex];
    members.splice(memberIndex, 1);

    // Обновляем список участников
    await setItem(`group_members.${groupId}`, members);

    // Обновляем количество участников группы
    group.memberCount = members.length;
    group.updatedAt = Date.now();
    await setItem(`groups.${groupId}`, group);

    // Удаляем группу из списка групп пользователя
    await removeGroupFromUsersList(currentUser.id, groupId);

    // Создаем системное сообщение о выходе пользователя
    const now = Date.now();
    const userName = member.isAnonymous
      ? (member.anonymousName || 'Анонимный пользователь')
      : currentUser.name;

    const systemMessage: GroupMessage = {
      id: `msg_${now}`,
      groupId,
      senderId: 'system',
      text: `${userName} покинул группу.`,
      timestamp: now,
      isAnonymous: false,
      isSystem: true
    };

    // Получаем текущие сообщения группы
    const messages: GroupMessage[] = await getItem(`group_messages.${groupId}`) || [];

    // Добавляем системное сообщение
    messages.push(systemMessage);
    await setItem(`group_messages.${groupId}`, messages);

    return true;
  } catch (error) {
    console.error('Ошибка при выходе из группы:', error);
    return false;
  }
}

// Отправить сообщение в группу
export const sendGroupMessage = async (
  groupId: string,
  text: string,
  isAnonymous = false
): Promise<GroupMessage | null> => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось отправить сообщение: пользователь не авторизован');
      return null;
    }

    // Получаем группу
    const group = await getItem(`groups.${groupId}`);
    if (!group) {
      console.error(`Группа ${groupId} не найдена`);
      return null;
    }

    // Получаем список участников
    const members: GroupMember[] = await getItem(`group_members.${groupId}`);
    if (!members) {
      console.error(`Список участников группы ${groupId} не найден`);
      return null;
    }

    // Проверяем, является ли пользователь участником группы
    const member = members.find(m => m.userId === currentUser.id);
    if (!member) {
      console.error(`Пользователь ${currentUser.id} не является участником группы ${groupId}`);
      return null;
    }

    // Создаем сообщение
    const now = Date.now();
    const message: GroupMessage = {
      id: `msg_${now}_${Math.floor(Math.random() * 1000)}`,
      groupId,
      senderId: currentUser.id,
      text,
      timestamp: now,
      isAnonymous: isAnonymous || member.isAnonymous,
      senderName: isAnonymous || member.isAnonymous
        ? (member.anonymousName || 'Анонимный пользователь')
        : currentUser.name
    };

    // Получаем текущие сообщения группы
    const messages: GroupMessage[] = await getItem(`group_messages.${groupId}`) || [];

    // Добавляем сообщение
    messages.push(message);
    await setItem(`group_messages.${groupId}`, messages);

    // Обновляем время последнего обновления группы
    group.updatedAt = now;
    await setItem(`groups.${groupId}`, group);

    return message;
  } catch (error) {
    console.error('Ошибка при отправке сообщения в группу:', error);
    return null;
  }
}

// Получить сообщения группы
export const getGroupMessages = async (groupId: string): Promise<GroupMessage[]> => {
  try {
    const messages = await getItem(`group_messages.${groupId}`);
    return messages || [];
  } catch (error) {
    console.error(`Ошибка при получении сообщений группы ${groupId}:`, error);
    return [];
  }
}

// Получить участников группы
export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
  try {
    const members = await getItem(`group_members.${groupId}`);
    return members || [];
  } catch (error) {
    console.error(`Ошибка при получении участников группы ${groupId}:`, error);
    return [];
  }
}

// Добавить группу в список групп пользователя
const addGroupToUsersList = async (userId: string, groupId: string): Promise<boolean> => {
  try {
    const userGroups: string[] = await getItem(`user_groups.${userId}`) || [];

    if (!userGroups.includes(groupId)) {
      userGroups.push(groupId);
      await setItem(`user_groups.${userId}`, userGroups);
    }

    return true;
  } catch (error) {
    console.error(`Ошибка при добавлении группы ${groupId} в список групп пользователя ${userId}:`, error);
    return false;
  }
}

// Удалить группу из списка групп пользователя
const removeGroupFromUsersList = async (userId: string, groupId: string): Promise<boolean> => {
  try {
    const userGroups: string[] = await getItem(`user_groups.${userId}`);

    if (!userGroups) {
      return true;
    }

    const updatedGroups = userGroups.filter(id => id !== groupId);
    await setItem(`user_groups.${userId}`, updatedGroups);

    return true;
  } catch (error) {
    console.error(`Ошибка при удалении группы ${groupId} из списка групп пользователя ${userId}:`, error);
    return false;
  }
}

// Получить группы пользователя
export const getUserGroups = async (userId?: string): Promise<Group[]> => {
  try {
    const currentUser = userId ? { id: userId } : await getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось получить группы: пользователь не авторизован');
      return [];
    }

    const userGroupIds: string[] = await getItem(`user_groups.${currentUser.id}`) || [];
    const groups: Group[] = [];

    for (const groupId of userGroupIds) {
      const group = await getItem(`groups.${groupId}`);
      if (group) {
        groups.push(group);
      }
    }

    return groups.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Ошибка при получении групп пользователя:', error);
    return [];
  }
}

// Найти случайную группу для присоединения
export const findRandomGroup = async (): Promise<Group | null> => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось найти случайную группу: пользователь не авторизован');
      return null;
    }

    const allGroups = await getAllGroups();

    // Фильтрация групп по критериям:
    // - группа не должна быть приватной
    // - группа не должна быть заполнена
    // - пользователь не должен быть уже участником группы

    const userGroups = await getUserGroups();
    const userGroupIds = userGroups.map(g => g.id);

    const availableGroups = allGroups.filter(group =>
      !group.isPrivate &&
      group.memberCount < group.maxMembers &&
      !userGroupIds.includes(group.id)
    );

    if (availableGroups.length === 0) {
      // Если нет доступных групп, создаем новую
      return createAnonymousGroup();
    }

    // Выбираем случайную группу
    const randomIndex = Math.floor(Math.random() * availableGroups.length);
    return availableGroups[randomIndex];
  } catch (error) {
    console.error('Ошибка при поиске случайной группы:', error);
    return null;
  }
}

// Создать анонимную группу
export const createAnonymousGroup = async (): Promise<Group | null> => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось создать анонимную группу: пользователь не авторизован');
      return null;
    }

    // Генерируем случайное название для группы
    const randomId = Math.floor(Math.random() * 10000);
    const name = `Анонимный чат #${randomId}`;

    // Создаем группу
    return createGroup(
      name,
      'Анонимный групповой чат для общения',
      true, // isAnonymous
      false, // isPrivate
      ['анонимный', 'общение'],
    );
  } catch (error) {
    console.error('Ошибка при создании анонимной группы:', error);
    return null;
  }
}

// Найти и присоединиться к случайной группе
export const findAndJoinRandomGroup = async (): Promise<{ group: Group | null, success: boolean }> => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось найти и присоединиться к случайной группе: пользователь не авторизован');
      return { group: null, success: false };
    }

    // Ищем случайную группу
    const group = await findRandomGroup();

    if (!group) {
      return { group: null, success: false };
    }

    // Генерируем анонимное имя
    const anonymousNames = [
      'Анонимный кот', 'Таинственный гость', 'Незнакомец', 'Инкогнито',
      'Тайный собеседник', 'Анонимус', 'Скрытый пользователь', 'Неизвестный'
    ];
    const randomNameIndex = Math.floor(Math.random() * anonymousNames.length);
    const anonymousName = `${anonymousNames[randomNameIndex]} ${Math.floor(Math.random() * 100)}`;

    // Присоединяемся к группе
    const success = await joinGroup(group.id, true, anonymousName);

    return { group, success };
  } catch (error) {
    console.error('Ошибка при поиске и присоединении к случайной группе:', error);
    return { group: null, success: false };
  }
}

import { User, getCurrentUser } from './user'
import { userStorage } from './userStorage'

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
  inviteCode?: string // Добавляем это поле
  imageUrl?: string // Оставляем для совместимости
}

// Константы для ключей
const GROUP_KEY_PREFIX = 'group_';
const GROUP_MEMBERS_KEY_PREFIX = 'group_members_';
const GROUP_MESSAGES_KEY_PREFIX = 'group_messages_';
const USER_GROUPS_KEY_PREFIX = 'user_groups_';

// Получить список всех групп
export const getAllGroups = (): Group[] => {
  try {
    const groups: Group[] = []

    // Получаем все группы из изолированного хранилища текущего пользователя
    const groupKeys = userStorage.getAllUserKeys().filter(key =>
      key.startsWith(GROUP_KEY_PREFIX) &&
      !key.includes('_members_') &&
      !key.includes('_messages_'));

    for (const key of groupKeys) {
      try {
        const groupData = userStorage.getItem<Group>(key, null);
        if (groupData) {
          groups.push(groupData);
        }
      } catch (error) {
        console.error(`Ошибка при обработке группы ${key}:`, error);
      }
    }

    return groups.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Ошибка при получении списка групп:', error);
    return [];
  }
};

// Создать новую группу
export const createGroup = (
  name: string,
  description = '',
  isAnonymous = false,
  isPrivate = false,
  tags: string[] = [],
  avatarUrl?: string
): Group | null => {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось создать группу: пользователь не авторизован');
      return null;
    }

    const groupId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Создаем новую группу
    const newGroup: Group = {
      id: groupId,
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser.id,
      memberCount: 1, // Создатель автоматически становится первым участником
      maxMembers: 100,
      isAnonymous,
      isPrivate,
      inviteCode: isPrivate ? `invite_${Math.random().toString(36).substring(2, 10)}` : undefined,
      imageUrl: avatarUrl,
      tags
    };

    // Сохраняем группу в изолированное хранилище
    userStorage.setItem(GROUP_KEY_PREFIX + groupId, newGroup);

    // Создаем список участников группы с создателем в качестве администратора
    const members: GroupMember[] = [
      {
        userId: currentUser.id,
        joinedAt: Date.now(),
        role: GroupMemberRole.ADMIN,
        isAnonymous: false
      }
    ];

    // Сохраняем список участников
    userStorage.setItem(GROUP_MEMBERS_KEY_PREFIX + groupId, members);

    // Инициализируем пустой список сообщений
    userStorage.setItem(GROUP_MESSAGES_KEY_PREFIX + groupId, []);

    // Добавляем группу в список групп пользователя
    addGroupToUsersList(currentUser.id, groupId);

    return newGroup;
  } catch (error) {
    console.error('Ошибка при создании группы:', error);
    return null;
  }
};

// Получить группу по идентификатору
export const getGroupById = (groupId: string): Group | null => {
  try {
    return userStorage.getItem<Group>(GROUP_KEY_PREFIX + groupId, null);
  } catch (error) {
    console.error(`Ошибка при получении группы ${groupId}:`, error);
    return null;
  }
};

// Добавить группу в список групп пользователя
export const addGroupToUsersList = (userId: string, groupId: string): boolean => {
  try {
    const userGroupsKey = USER_GROUPS_KEY_PREFIX + userId;
    const userGroups = userStorage.getItem<string[]>(userGroupsKey, []);

    if (!userGroups.includes(groupId)) {
      userGroups.push(groupId);
      userStorage.setItem(userGroupsKey, userGroups);
    }

    return true;
  } catch (error) {
    console.error(`Ошибка при добавлении группы ${groupId} в список пользователя ${userId}:`, error);
    return false;
  }
};

// Получить группы пользователя
export const getUserGroups = (): Group[] => {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось получить группы: пользователь не авторизован');
      return [];
    }

    const userGroupsKey = USER_GROUPS_KEY_PREFIX + currentUser.id;
    const userGroupIds = userStorage.getItem<string[]>(userGroupsKey, []);

    const groups: Group[] = [];

    for (const groupId of userGroupIds) {
      const group = getGroupById(groupId);
      if (group) {
        groups.push(group);
      }
    }

    return groups.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Ошибка при получении групп пользователя:', error);
    return [];
  }
};

// Присоединиться к группе
export const joinGroup = (
  groupId: string,
  isAnonymous = false,
  anonymousName?: string
): boolean => {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось присоединиться к группе: пользователь не авторизован');
      return false;
    }

    // Получаем данные о группе
    const group = getGroupById(groupId);

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
    const members = userStorage.getItem<GroupMember[]>(GROUP_MEMBERS_KEY_PREFIX + groupId, []);

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
    userStorage.setItem(GROUP_MEMBERS_KEY_PREFIX + groupId, members);

    // Обновляем количество участников группы
    group.memberCount = members.length;
    group.updatedAt = Date.now();
    userStorage.setItem(GROUP_KEY_PREFIX + groupId, group);

    // Добавляем группу в список групп пользователя
    addGroupToUsersList(currentUser.id, groupId);

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
    const messages = userStorage.getItem<GroupMessage[]>(GROUP_MESSAGES_KEY_PREFIX + groupId, []);

    // Добавляем системное сообщение
    messages.push(systemMessage);
    userStorage.setItem(GROUP_MESSAGES_KEY_PREFIX + groupId, messages);

    return true;
  } catch (error) {
    console.error('Ошибка при присоединении к группе:', error);
    return false;
  }
};

// Покинуть группу
export const leaveGroup = (groupId: string): boolean => {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось покинуть группу: пользователь не авторизован');
      return false;
    }

    // Получаем данные о группе
    const group = getGroupById(groupId);

    if (!group) {
      console.error(`Группа ${groupId} не найдена`);
      return false;
    }

    // Получаем список участников группы
    const members = userStorage.getItem<GroupMember[]>(GROUP_MEMBERS_KEY_PREFIX + groupId, []);

    // Ищем пользователя в списке участников
    const memberIndex = members.findIndex(m => m.userId === currentUser.id);

    if (memberIndex === -1) {
      console.error(`Пользователь ${currentUser.id} не найден в списке участников группы ${groupId}`);
      return false;
    }

    // Проверяем, является ли пользователь единственным администратором
    const isLastAdmin =
      members[memberIndex].role === GroupMemberRole.ADMIN &&
      members.filter(m => m.role === GroupMemberRole.ADMIN).length === 1;

    if (isLastAdmin && members.length > 1) {
      // Находим другого участника для передачи прав администратора
      const newAdminIndex = members.findIndex(m => m.userId !== currentUser.id);

      if (newAdminIndex !== -1) {
        members[newAdminIndex].role = GroupMemberRole.ADMIN;
      }
    }

    // Удаляем пользователя из списка участников
    const userInfo = members[memberIndex];
    members.splice(memberIndex, 1);

    // Обновляем список участников группы
    userStorage.setItem(GROUP_MEMBERS_KEY_PREFIX + groupId, members);

    // Обновляем информацию о группе
    if (members.length === 0) {
      // Если группа осталась пустой, удаляем её
      userStorage.removeItem(GROUP_KEY_PREFIX + groupId);
      userStorage.removeItem(GROUP_MEMBERS_KEY_PREFIX + groupId);
      userStorage.removeItem(GROUP_MESSAGES_KEY_PREFIX + groupId);
    } else {
      // Иначе обновляем количество участников
      group.memberCount = members.length;
      group.updatedAt = Date.now();
      userStorage.setItem(GROUP_KEY_PREFIX + groupId, group);
    }

    // Удаляем группу из списка групп пользователя
    const userGroupsKey = USER_GROUPS_KEY_PREFIX + currentUser.id;
    const userGroups = userStorage.getItem<string[]>(userGroupsKey, []);
    const updatedUserGroups = userGroups.filter(id => id !== groupId);
    userStorage.setItem(userGroupsKey, updatedUserGroups);

    // Если группа не была удалена, добавляем системное сообщение о выходе пользователя
    if (members.length > 0) {
      const userName = userInfo.isAnonymous
        ? (userInfo.anonymousName || 'Анонимный пользователь')
        : currentUser.name || 'Пользователь';

      const systemMessage: GroupMessage = {
        id: `msg_${Date.now()}`,
        groupId,
        senderId: 'system',
        text: `${userName} покинул группу.`,
        timestamp: Date.now(),
        isAnonymous: false,
        isSystem: true
      };

      // Получаем текущие сообщения группы
      const messages = userStorage.getItem<GroupMessage[]>(GROUP_MESSAGES_KEY_PREFIX + groupId, []);

      // Добавляем системное сообщение о выходе пользователя
      messages.push(systemMessage);
      userStorage.setItem(GROUP_MESSAGES_KEY_PREFIX + groupId, messages);
    }

    return true;
  } catch (error) {
    console.error('Ошибка при выходе из группы:', error);
    return false;
  }
};

// Отправить сообщение в группу
export const sendGroupMessage = (
  groupId: string,
  text: string,
  isAnonymous = false
): GroupMessage | null => {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось отправить сообщение: пользователь не авторизован');
      return null;
    }

    // Получаем группу
    const group = getGroupById(groupId);
    if (!group) {
      console.error(`Группа ${groupId} не найдена`);
      return null;
    }

    // Получаем список участников
    const members = userStorage.getItem<GroupMember[]>(GROUP_MEMBERS_KEY_PREFIX + groupId, []);

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
    const messages = userStorage.getItem<GroupMessage[]>(GROUP_MESSAGES_KEY_PREFIX + groupId, []);

    // Добавляем сообщение
    messages.push(message);
    userStorage.setItem(GROUP_MESSAGES_KEY_PREFIX + groupId, messages);

    // Обновляем время последнего обновления группы
    group.updatedAt = now;
    userStorage.setItem(GROUP_KEY_PREFIX + groupId, group);

    return message;
  } catch (error) {
    console.error('Ошибка при отправке сообщения в группу:', error);
    return null;
  }
};

// Получить сообщения группы
export const getGroupMessages = (groupId: string): GroupMessage[] => {
  try {
    return userStorage.getItem<GroupMessage[]>(GROUP_MESSAGES_KEY_PREFIX + groupId, []);
  } catch (error) {
    console.error(`Ошибка при получении сообщений группы ${groupId}:`, error);
    return [];
  }
};

// Получить участников группы
export const getGroupMembers = (groupId: string): GroupMember[] => {
  try {
    return userStorage.getItem<GroupMember[]>(GROUP_MEMBERS_KEY_PREFIX + groupId, []);
  } catch (error) {
    console.error(`Ошибка при получении участников группы ${groupId}:`, error);
    return [];
  }
};

// Найти и присоединиться к случайной группе
export const findAndJoinRandomGroup = (): Group | null => {
  try {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      console.error('Не удалось найти группу: пользователь не авторизован');
      return null;
    }

    // Получаем все группы
    const allGroups = getAllGroups();

    // Фильтруем только публичные группы с доступными местами
    const availableGroups = allGroups.filter(group =>
      !group.isPrivate &&
      group.memberCount < group.maxMembers &&
      group.createdBy !== currentUser.id // Исключаем группы, созданные текущим пользователем
    );

    if (availableGroups.length === 0) {
      console.log('Не найдено доступных групп');
      return null;
    }

    // Выбираем случайную группу
    const randomIndex = Math.floor(Math.random() * availableGroups.length);
    const randomGroup = availableGroups[randomIndex];

    // Присоединяемся к группе
    const joined = joinGroup(randomGroup.id);

    if (!joined) {
      console.error(`Не удалось присоединиться к группе ${randomGroup.id}`);
      return null;
    }

    return randomGroup;
  } catch (error) {
    console.error('Ошибка при поиске случайной группы:', error);
    return null;
  }
};

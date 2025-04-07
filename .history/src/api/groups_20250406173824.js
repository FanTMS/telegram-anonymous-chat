// API для работы с группами - перенаправляем запросы в services/groups
import {
    createGroup,
    getGroupById,
    updateGroup,
    getUserGroups,
    getPublicGroups,
    joinGroup,
    leaveGroup,
    sendGroupMessage,
    getGroupMessages,
    searchGroups
} from '../services/groups';

// Экспортируем все функции для компонентов
export {
    createGroup,
    getGroupById,
    updateGroup,
    getUserGroups,
    getPublicGroups,
    joinGroup,
    leaveGroup,
    sendGroupMessage,
    getGroupMessages,
    searchGroups
};

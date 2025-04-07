// Сервис для работы с группами - перенаправляем запросы в groupService
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
} from './groupService';

// Экспортируем все функции для API
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

import React from 'react';
import GroupForm from '../components/groups/GroupForm';

/**
 * Страница создания новой группы
 * @param {Object} props - Свойства компонента
 * @param {Object} props.user - Объект пользователя
 */
const GroupCreate = ({ user }) => {
    return (
        <GroupForm user={user} />
    );
};

export default GroupCreate;

import React from 'react';
import { useParams } from 'react-router-dom';
import GroupForm from '../components/groups/GroupForm';

/**
 * Страница редактирования группы
 * @param {Object} props - Свойства компонента
 * @param {Object} props.user - Объект пользователя
 */
const GroupEdit = ({ user }) => {
  const { groupId } = useParams();
  
  return (
    <GroupForm groupId={groupId} user={user} />
  );
};

export default GroupEdit;

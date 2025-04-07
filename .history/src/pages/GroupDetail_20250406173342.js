import React from 'react';
import { useParams } from 'react-router-dom';
import GroupDetailComponent from '../components/groups/GroupDetail';

/**
 * Страница детальной информации о группе
 * @param {Object} props - Свойства компонента
 * @param {Object} props.user - Объект пользователя
 */
const GroupDetail = ({ user }) => {
  const { groupId } = useParams();
  
  return (
    <GroupDetailComponent groupId={groupId} user={user} />
  );
};

export default GroupDetail;

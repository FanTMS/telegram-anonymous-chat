import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import GroupListItem from './GroupListItem';
import { motion } from 'framer-motion';

const GroupListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 8px 0;
`;

const EmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  text-align: center;
  color: var(--tg-theme-hint-color, #999);
  font-size: 16px;
  line-height: 1.5;
  
  svg {
    margin-bottom: 16px;
    fill: var(--tg-theme-hint-color, #999);
    opacity: 0.5;
  }
`;

const CreateGroupButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  padding: 12px 16px;
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #fff);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(16, 35, 47, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover, &:active {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(16, 35, 47, 0.15);
  }
  
  svg {
    margin-right: 8px;
  }
`;

const GroupList = ({ groups = [], onGroupClick, showCreateButton = true, isLoading = false }) => {
  // Анимация для элементов списка
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <GroupListContainer>
        {Array(3).fill(0).map((_, index) => (
          <GroupListItem key={`skeleton-${index}`} isLoading={true} />
        ))}
      </GroupListContainer>
    );
  }

  if (!groups.length) {
    return (
      <GroupListContainer>
        <EmptyMessage>
          <svg width="56" height="56" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8-8-3.59 8-8 8zm0-13.5c-2.49 0-4.5 2.01-4.5 4.5 0 1.41.68 2.65 1.72 3.43.24.19.53.28.83.28h3.9c.3 0 .59-.09.83-.28 1.04-.78 1.72-2.02 1.72-3.43 0-2.49-2.01-4.5-4.5-4.5zm-1.5 9h3v1h-3v-1zm1.5-6c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
          </svg>
          <div>Группы не найдены</div>
          <div>Создайте новую группу или присоединитесь к существующей</div>
        </EmptyMessage>
        {showCreateButton && (
          <CreateGroupButton to="/groups/create">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Создать группу
          </CreateGroupButton>
        )}
      </GroupListContainer>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      component={GroupListContainer}
    >
      {groups.map(group => (
        <motion.div key={group.id} variants={itemVariants}>
          <GroupListItem 
            group={group} 
            onClick={() => onGroupClick && onGroupClick(group)}
          />
        </motion.div>
      ))}
      
      {showCreateButton && (
        <motion.div variants={itemVariants}>
          <CreateGroupButton to="/groups/create">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Создать группу
          </CreateGroupButton>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GroupList;

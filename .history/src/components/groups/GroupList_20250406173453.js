import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import GroupListItem from './GroupListItem';

const GroupListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: var(--tg-theme-hint-color, #999);
`;

const CreateGroupButton = styled(Link)`
  display: block;
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #fff);
  border: none;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  margin: 12px 0;

  &:hover {
    opacity: 0.9;
  }
`;

/**
 * Компонент списка групп
 * @param {Object} props - Свойства компонента
 * @param {Array} props.groups - Массив групп для отображения
 * @param {boolean} props.loading - Индикатор загрузки
 * @param {boolean} props.showCreateButton - Показывать ли кнопку создания группы
 * @param {Function} props.onGroupClick - Обработчик клика по группе
 */
const GroupList = ({ groups = [], loading = false, showCreateButton = true, onGroupClick }) => {
    if (loading) {
        return (
            <GroupListContainer>
                <EmptyMessage>Загрузка групп...</EmptyMessage>
            </GroupListContainer>
        );
    }

    if (!groups.length) {
        return (
            <GroupListContainer>
                <EmptyMessage>Группы не найдены</EmptyMessage>
                {showCreateButton && (
                    <CreateGroupButton to="/groups/create">
                        Создать группу
                    </CreateGroupButton>
                )}
            </GroupListContainer>
        );
    }

    return (
        <GroupListContainer>
            {groups.map(group => (
                <GroupListItem
                    key={group.id}
                    group={group}
                    onClick={() => onGroupClick && onGroupClick(group)}
                />
            ))}

            {showCreateButton && (
                <CreateGroupButton to="/groups/create">
                    Создать группу
                </CreateGroupButton>
            )}
        </GroupListContainer>
    );
};

export default GroupList;

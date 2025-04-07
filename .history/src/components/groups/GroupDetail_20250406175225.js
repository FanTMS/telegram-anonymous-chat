import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
    getGroupById,
    joinGroup,
    leaveGroup
} from '../../services/groupService';
import GroupMessages from './GroupMessages';

const GroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const GroupHeader = styled.div`
  display: flex;
  padding: 12px;
  border-bottom: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.1));
  align-items: center;
`;

const GroupAvatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  background-image: ${props => props.src ? `url(${props.src})` : 'none'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
`;

const GroupInitial = styled.span`
  font-size: 26px;
  font-weight: bold;
  color: var(--tg-theme-hint-color, #999);
`;

const GroupInfo = styled.div`
  flex: 1;
`;

const GroupName = styled.h2`
  margin: 0 0 4px 0;
  font-size: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const GroupMeta = styled.div`
  display: flex;
  color: var(--tg-theme-hint-color, #999);
  font-size: 13px;
`;

const GroupTypeLabel = styled.span`
  margin-right: 8px;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 4px;
    width: 14px;
    height: 14px;
  }
`;

const GroupDescription = styled.div`
  font-size: 14px;
  color: var(--tg-theme-text-color, #222);
  margin: 8px 0;
  line-height: 1.4;
`;

const StyledButton = styled.button`
  background-color: ${props => props.danger
        ? 'var(--tg-theme-destructive-color, #e53935)'
        : 'var(--tg-theme-button-color, #2481cc)'};
  color: var(--tg-theme-button-text-color, #fff);
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  margin-left: 8px;
  cursor: pointer;
  background-color: ${props => props.$danger === 'true' 
    ? 'var(--tg-theme-destructive-color, #ff3b30)' 
    : 'var(--tg-theme-button-color, #2481cc)'};
  color: var(--tg-theme-button-text-color, #fff);
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: var(--tg-theme-link-color, #2481cc);
  font-size: 16px;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 4px;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 12px;
  gap: 12px;
`;

/**
 * Компонент детальной информации о группе
 * @param {Object} props - Свойства компонента
 * @param {string} props.groupId - ID группы
 * @param {Object} props.user - Объект пользователя
 */
const GroupDetail = ({ groupId, user }) => {
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMember, setIsMember] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [processing, setProcessing] = useState(false);

    const navigate = useNavigate();

    // Загрузка информации о группе
    useEffect(() => {
        const loadGroup = async () => {
            try {
                setLoading(true);
                const groupData = await getGroupById(groupId);

                if (!groupData) {
                    setError('Группа не найдена');
                    return;
                }

                setGroup(groupData);

                // Проверяем, является ли пользователь участником группы
                const userMembership = groupData.members?.[user?.id];
                setIsMember(!!userMembership && userMembership.isActive);
                setIsAdmin(userMembership?.role === 'admin');
            } catch (err) {
                console.error('Ошибка при загрузке группы:', err);
                setError(err.message || 'Ошибка при загрузке группы');
            } finally {
                setLoading(false);
            }
        };

        if (groupId) {
            loadGroup();
        }
    }, [groupId, user?.id]);

    // Обработчик присоединения к группе
    const handleJoinGroup = async () => {
        if (!user?.id) {
            alert('Войдите в систему, чтобы присоединиться к группе');
            return;
        }

        try {
            setProcessing(true);
            await joinGroup(groupId, user.id);
            setIsMember(true);

            // Обновляем информацию о группе
            const updatedGroup = await getGroupById(groupId);
            setGroup(updatedGroup);
        } catch (err) {
            console.error('Ошибка при присоединении к группе:', err);
            alert('Не удалось присоединиться к группе: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    // Обработчик выхода из группы
    const handleLeaveGroup = async () => {
        if (!window.confirm('Вы уверены, что хотите покинуть эту группу?')) {
            return;
        }

        try {
            setProcessing(true);
            await leaveGroup(groupId, user.id);
            setIsMember(false);

            // Обновляем информацию о группе
            const updatedGroup = await getGroupById(groupId);
            setGroup(updatedGroup);
        } catch (err) {
            console.error('Ошибка при выходе из группы:', err);
            alert('Не удалось покинуть группу: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    // Обработчик редактирования группы
    const handleEditGroup = () => {
        navigate(`/groups/${groupId}/edit`);
    };

    // Обработчик возврата к списку групп
    const handleBack = () => {
        navigate('/groups');
    };

    if (loading) {
        return <div>Загрузка информации о группе...</div>;
    }

    if (error) {
        return (
            <div>
                <p>Ошибка: {error}</p>
                <BackButton onClick={handleBack}>
                    &larr; Вернуться к списку групп
                </BackButton>
            </div>
        );
    }

    if (!group) {
        return (
            <div>
                <p>Группа не найдена</p>
                <BackButton onClick={handleBack}>
                    &larr; Вернуться к списку групп
                </BackButton>
            </div>
        );
    }

    // Получаем первую букву названия группы для аватара
    const initial = group.name.charAt(0).toUpperCase();

    return (
        <GroupContainer>
            <GroupHeader>
                <BackButton onClick={handleBack}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </BackButton>

                <GroupAvatar src={group.avatar}>
                    {!group.avatar && <GroupInitial>{initial}</GroupInitial>}
                </GroupAvatar>

                <GroupInfo>
                    <GroupName>{group.name}</GroupName>
                    <GroupMeta>
                        <GroupTypeLabel>
                            {group.isPublic ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="16" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                    Публичная
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11В7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    Приватная
                                </>
                            )}
                        </GroupTypeLabel>

                        {group.isAnonymous && (
                            <GroupTypeLabel>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 19c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" />
                                    <path d="M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                                </svg>
                                Анонимная
                            </GroupTypeLabel>
                        )}

                        <GroupTypeLabel>
                            {group.memberCount} {getWordForm(group.memberCount, ['участник', 'участника', 'участников'])}
                        </GroupTypeLabel>
                    </GroupMeta>

                    {group.description && (
                        <GroupDescription>{group.description}</GroupDescription>
                    )}
                </GroupInfo>
            </GroupHeader>

            {!isMember && group.isPublic && (
                <ButtonsContainer>
                    <StyledButton
                        onClick={handleJoinGroup}
                        disabled={processing}
                    >
                        Присоединиться к группе
                    </StyledButton>
                </ButtonsContainer>
            )}

            {isMember && (
                <ButtonsContainer>
                    {isAdmin && (
                        <StyledButton onClick={handleEditGroup} disabled={processing}>
                            Редактировать группу
                        </StyledButton>
                    )}

                    <ActionButton
                        onClick={handleLeaveGroup}
                        disabled={processing}
                        $danger="true"
                    >
                        Покинуть группу
                    </ActionButton>
                </ButtonsContainer>
            )}

            {isMember && (
                <GroupMessages
                    groupId={groupId}
                    user={user}
                    group={group}
                />
            )}
        </GroupContainer>
    );
};

/**
 * Возвращает правильную форму слова в зависимости от числа
 * @param {number} count - Число
 * @param {Array} wordForms - Массив форм слова [одно, два-четыре, пять-двадцать]
 * @returns {string} Правильная форма слова
 */
function getWordForm(count, wordForms) {
    const cases = [2, 0, 1, 1, 1, 2];
    const mod = count % 100;
    const wordIndex = (mod > 4 && mod < 20) ? 2 : cases[Math.min(mod % 10, 5)];
    return wordForms[wordIndex];
}

export default GroupDetail;

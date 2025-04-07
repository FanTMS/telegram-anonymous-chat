import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import moment from 'moment';
import 'moment/locale/ru';

const GroupItemContainer = styled(Link)`
  display: flex;
  background-color: var(--tg-theme-bg-color, #fff);
  border-radius: 10px;
  padding: 12px;
  text-decoration: none;
  color: var(--tg-theme-text-color, #000);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const GroupAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  background-image: ${props => props.src ? `url(${props.src})` : 'none'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
`;

const GroupInitial = styled.span`
  font-size: 24px;
  font-weight: bold;
  color: var(--tg-theme-hint-color, #999);
`;

const GroupInfo = styled.div`
  flex: 1;
  overflow: hidden;
`;

const GroupName = styled.div`
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const GroupDescription = styled.div`
  color: var(--tg-theme-hint-color, #999);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
`;

const GroupMetaInfo = styled.div`
  display: flex;
  font-size: 12px;
  color: var(--tg-theme-hint-color, #999);
  justify-content: space-between;
`;

const GroupMemberCount = styled.span`
  margin-right: 8px;
`;

const GroupType = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
  
  svg {
    margin-right: 4px;
    width: 14px;
    height: 14px;
  }
`;

const GroupLastActivity = styled.span``;

/**
 * Компонент элемента списка групп
 * @param {Object} props - Свойства компонента
 * @param {Object} props.group - Объект группы
 * @param {Function} props.onClick - Обработчик клика по группе
 */
const GroupListItem = ({ group, onClick }) => {
  // Получаем первую букву названия группы для аватара
  const initial = group.name.charAt(0).toUpperCase();
  
  // Форматирование времени последней активности
  const formattedLastActivity = moment(group.lastActivity).fromNow();
  
  // Собираем текст для отображения последнего сообщения
  const lastMessageText = group.lastMessage 
    ? `${group.lastMessage.senderName}: ${group.lastMessage.text}`
    : 'Нет сообщений';

  return (
    <GroupItemContainer to={`/groups/${group.id}`} onClick={onClick}>
      <GroupAvatar src={group.avatar}>
        {!group.avatar && <GroupInitial>{initial}</GroupInitial>}
      </GroupAvatar>
      
      <GroupInfo>
        <GroupName>{group.name}</GroupName>
        <GroupDescription>{lastMessageText}</GroupDescription>
        
        <GroupMetaInfo>
          <div>
            <GroupMemberCount>
              {group.memberCount} {getWordForm(group.memberCount, ['участник', 'участника', 'участников'])}
            </GroupMemberCount>
            
            <GroupType>
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
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Приватная
                </>
              )}
            </GroupType>
            
            {group.isAnonymous && (
              <GroupType>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" />
                  <path d="M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                </svg>
                Анонимная
              </GroupType>
            )}
          </div>
          
          <GroupLastActivity>{formattedLastActivity}</GroupLastActivity>
        </GroupMetaInfo>
      </GroupInfo>
    </GroupItemContainer>
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

export default GroupListItem;

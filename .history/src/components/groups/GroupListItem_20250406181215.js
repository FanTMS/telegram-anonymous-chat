import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { formatLastActivity } from '../../utils/dateUtils';

const GroupItemContainer = styled(Link)`
  display: flex;
  background-color: var(--tg-theme-bg-color, #fff);
  padding: 10px 16px;
  text-decoration: none;
  color: var(--tg-theme-text-color, #000);
  transition: background-color 0.2s;
  
  &:hover, &:active {
    background-color: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.05));
  }
`;

const GroupAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => props.$color || 'var(--tg-theme-secondary-bg-color, #f0f0f0)'};
  background-image: ${props => props.src ? `url(${props.src})` : 'none'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  position: relative;
  
  ${props => props.$online && `
    &::after {
      content: '';
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background-color: #4CAF50;
      border-radius: 50%;
      border: 2px solid var(--tg-theme-bg-color, #fff);
    }
  `}
`;

const GroupInitial = styled.span`
  font-size: 20px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
`;

const GroupInfo = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const GroupNameRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
`;

const GroupName = styled.div`
  font-weight: 500;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LastActive = styled.div`
  font-size: 12px;
  color: var(--tg-theme-hint-color, #999);
  white-space: nowrap;
  margin-left: 8px;
`;

const LastMessage = styled.div`
  display: flex;
  color: var(--tg-theme-hint-color, #999);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Skeleton = styled.div`
  background-color: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.05));
  border-radius: ${props => props.$circle ? '50%' : '4px'};
  animation: pulse 1.5s infinite ease-in-out;
  
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 0.8; }
    100% { opacity: 0.6; }
  }
`;

const SkeletonAvatar = styled(Skeleton)`
  width: 48px;
  height: 48px;
  margin-right: 12px;
  flex-shrink: 0;
`;

const SkeletonContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SkeletonLine = styled(Skeleton)`
  height: 14px;
  width: ${props => props.$width || '100%'};
`;

const MemberCount = styled.span`
  margin-right: 4px;
  color: var(--tg-theme-hint-color, #999);
`;

const GroupBadge = styled.div`
  display: inline-block;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
  background-color: ${props => props.$isPublic 
    ? 'var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2))' 
    : 'var(--tg-theme-button-color, #2481cc)'};
  color: ${props => props.$isPublic 
    ? 'var(--tg-theme-text-color, #000)' 
    : 'var(--tg-theme-button-text-color, #fff)'};
`;

const GroupListItem = ({ group, onClick, isLoading }) => {
  // Для скелетон-загрузки
  if (isLoading) {
    return (
      <GroupItemContainer as="div">
        <SkeletonAvatar $circle />
        <SkeletonContent>
          <SkeletonLine $width="70%" />
          <SkeletonLine $width="90%" />
        </SkeletonContent>
      </GroupItemContainer>
    );
  }

  if (!group) return null;

  // Генерация цвета для аватара на основе ID группы
  const getGroupColor = () => {
    const colors = [
      'linear-gradient(135deg, #FF6B6B, #FF9E7D)',
      'linear-gradient(135deg, #6BCB77, #88E0D0)',
      'linear-gradient(135deg, #4D96FF, #7DA8FF)',
      'linear-gradient(135deg, #9C6BFF, #C8A8FF)',
      'linear-gradient(135deg, #FFB347, #FFDA79)'
    ];
    
    const index = group.id ? Math.abs(group.id.charCodeAt(0) + group.id.charCodeAt(group.id.length - 1)) % colors.length : 0;
    return colors[index];
  };

  const getInitial = () => {
    if (!group.name) return '?';
    return group.name.charAt(0).toUpperCase();
  };

  const getMemberCount = () => {
    if (!group.members) return 0;
    
    if (Array.isArray(group.members)) {
      return group.members.length;
    } else if (typeof group.members === 'object') {
      return Object.keys(group.members).length;
    }
    
    return group.memberCount || 0;
  };

  return (
    <GroupItemContainer 
      to={`/groups/${group.id}`} 
      onClick={onClick}
    >
      <GroupAvatar $color={getGroupColor()} src={group.avatar}>
        {!group.avatar && <GroupInitial>{getInitial()}</GroupInitial>}
      </GroupAvatar>

      <GroupInfo>
        <GroupNameRow>
          <GroupName>
            {group.name}
            {group.isPublic && <GroupBadge $isPublic>Публичная</GroupBadge>}
          </GroupName>
          <LastActive>{formatLastActivity(group.lastActivity)}</LastActive>
        </GroupNameRow>
        
        <LastMessage>
          <MemberCount>{getMemberCount()} участн.</MemberCount>
          {group.lastMessage && group.lastMessage}
        </LastMessage>
      </GroupInfo>
    </GroupItemContainer>
  );
};

export default GroupListItem;

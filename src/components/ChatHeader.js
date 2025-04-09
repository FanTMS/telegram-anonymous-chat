import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { isCompactMode } from '../utils/telegramUtils';
import PropTypes from 'prop-types';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--tg-theme-bg-color, #ffffff);
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  padding-top: calc(12px + env(safe-area-inset-top, 0));
  height: ${props => props.isCompact ? 'var(--compact-header-height, 48px)' : '60px'};
  animation: ${fadeIn} 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  ${props => props.isCompact && `
    padding: 8px 10px;
    padding-top: calc(8px + var(--safe-area-top, env(safe-area-inset-top, 0)));
    padding-left: calc(10px + var(--safe-area-left, env(safe-area-inset-left, 0)));
    padding-right: calc(10px + var(--safe-area-right, env(safe-area-inset-right, 0)));
  `}
  
  /* Специфические стили для iPhone с вырезом */
  @supports (padding-top: constant(safe-area-inset-top)) {
    padding-top: calc(12px + constant(safe-area-inset-top));
    
    ${props => props.isCompact && `
      padding-top: calc(8px + constant(safe-area-inset-top));
      padding-left: calc(10px + constant(safe-area-inset-left));
      padding-right: calc(10px + constant(safe-area-inset-right));
    `}
  }
  
  @media (min-width: 481px) {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0 0 16px 16px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  ${props => props.isCompact && `
    gap: 8px;
  `}
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  ${props => props.isCompact && `
    gap: 10px;
  `}
`;

const UserInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const UserName = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--tg-theme-text-color, #000000);
  
  ${props => props.isCompact && `
    font-size: 16px;
  `}
`;

const UserStatus = styled.span`
  font-size: 13px;
  color: var(--tg-theme-hint-color, #999999);
  margin-top: 2px;
  
  ${props => props.isCompact && `
    font-size: 11px;
    margin-top: 1px;
  `}
`;

const ChatEndedStatus = styled(UserStatus)`
  color: #FF3B30;
  display: flex;
  align-items: center;
  
  &:before {
    content: "";
    display: inline-block;
    width: 7px;
    height: 7px;
    background-color: #FF3B30;
    border-radius: 50%;
    margin-right: 5px;
  }
`;

const TypingStatus = styled(UserStatus)`
  color: var(--tg-theme-button-color, #3390EC);
  position: relative;
  display: flex;
  align-items: center;
  
  &:before {
    content: "";
    display: inline-block;
    width: 7px;
    height: 7px;
    background-color: var(--tg-theme-button-color, #3390EC);
    border-radius: 50%;
    margin-right: 5px;
    animation: pulse 1.5s infinite;
    
    @keyframes pulse {
      0% {
        transform: scale(0.8);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.7;
      }
      100% {
        transform: scale(0.8);
        opacity: 1;
      }
    }
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: var(--tg-theme-button-color, #3390EC);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  transition: background-color 0.2s;
  
  &:active {
    background-color: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.05));
  }
  
  ${props => props.isCompact && `
    width: 32px;
    height: 32px;
    font-size: 22px;
  `}
`;

const EndChatButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: ${props => props.isAdmin ? 'var(--tg-theme-button-color, #3390EC)' : 'transparent'};
  color: ${props => props.isAdmin ? 'var(--tg-theme-button-text-color, #ffffff)' : 'var(--tg-theme-destructive-color, #FF3B30)'};
  border: ${props => props.isAdmin ? 'none' : '1px solid var(--tg-theme-destructive-color, #FF3B30)'};
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  ${props => props.isCompact && `
    padding: 4px 8px;
    font-size: 12px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  `}
  
  ${props => props.disabled && `
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      opacity: 0.5;
    }
    
    &:active {
      transform: none;
    }
  `}
`;

const AvatarImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
  
  ${props => props.isCompact && `
    width: 36px;
    height: 36px;
    margin-right: 8px;
  `}
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--tg-theme-button-color, #3390EC);
  color: var(--tg-theme-button-text-color, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  margin-right: 10px;
  
  ${props => props.isCompact && `
    width: 36px;
    height: 36px;
    font-size: 14px;
    margin-right: 8px;
  `}
`;

const ChatHeader = ({ 
    partnerInfo, 
    isPartnerTyping, 
    isSupportChat, 
    onEndChat,
    isAdmin,
    chatEnded
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [compact, setCompact] = useState(false);
    
    useEffect(() => {
        const checkCompactMode = () => {
            setCompact(isCompactMode());
        };
        
        checkCompactMode();
        window.addEventListener('resize', checkCompactMode);
        
        return () => {
            window.removeEventListener('resize', checkCompactMode);
        };
    }, []);

    const handleBackClick = () => {
        if (location.pathname.includes('/chat/')) {
            navigate('/chats');
        } else {
            navigate(-1);
        }
    };
    
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <HeaderContainer isCompact={compact}>
            <LeftSection isCompact={compact}>
                <BackButton isCompact={compact} onClick={handleBackClick}>
                    <i className="fas fa-arrow-left"></i>
                </BackButton>
                
                {partnerInfo.avatar ? (
                    <AvatarImage 
                        src={partnerInfo.avatar} 
                        alt={partnerInfo.name} 
                        isCompact={compact}
                        style={chatEnded ? { opacity: 0.7 } : {}}
                    />
                ) : (
                    <AvatarPlaceholder 
                        isCompact={compact}
                        style={chatEnded ? { opacity: 0.7, backgroundColor: '#8e8e93' } : {}}
                    >
                        {getInitials(partnerInfo.name)}
                    </AvatarPlaceholder>
                )}
                
                <UserInfoContainer>
                    <UserName isCompact={compact}>{partnerInfo.name}</UserName>
                    {chatEnded ? (
                        <ChatEndedStatus isCompact={compact}>Чат завершен</ChatEndedStatus>
                    ) : isPartnerTyping ? (
                        <TypingStatus isCompact={compact}>печатает...</TypingStatus>
                    ) : (
                        <UserStatus isCompact={compact}>
                            {isSupportChat ? 'Всегда на связи' : 'В сети'}
                        </UserStatus>
                    )}
                </UserInfoContainer>
            </LeftSection>
            
            <RightSection isCompact={compact}>
                {!isSupportChat && !chatEnded && (
                    <EndChatButton onClick={onEndChat} isCompact={compact}>
                        <svg 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                        <span>Завершить</span>
                    </EndChatButton>
                )}
                
                {isSupportChat && isAdmin && !chatEnded && (
                    <EndChatButton isAdmin onClick={onEndChat} isCompact={compact}>
                        <svg 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        <span>Завершить</span>
                    </EndChatButton>
                )}
                
                {chatEnded && (
                    <EndChatButton disabled isCompact={compact}>
                        <svg 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                        <span>Завершен</span>
                    </EndChatButton>
                )}
            </RightSection>
        </HeaderContainer>
    );
};

ChatHeader.propTypes = {
    partnerInfo: PropTypes.shape({
        name: PropTypes.string.isRequired,
        avatar: PropTypes.string,
        lastSeen: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
    }).isRequired,
    isPartnerTyping: PropTypes.bool,
    isSupportChat: PropTypes.bool,
    onEndChat: PropTypes.func.isRequired,
    isAdmin: PropTypes.bool,
    chatEnded: PropTypes.bool
};

ChatHeader.defaultProps = {
    isPartnerTyping: false,
    isSupportChat: false,
    isAdmin: false,
    chatEnded: false
};

export default ChatHeader; 
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';
import { formatMessageTime } from '../utils/dateUtils';
import { isCompactMode } from '../utils/telegramUtils';

// Message entry animation
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const MessageContainer = styled.div`
  display: flex;
  margin-bottom: 8px;
  padding: 0 16px;
  padding-left: calc(16px + env(safe-area-inset-left, 0));
  padding-right: calc(16px + env(safe-area-inset-right, 0));
  animation: ${fadeIn} 0.3s ease-out;
  position: relative;
  
  @supports (padding-left: constant(safe-area-inset-left)) {
    padding-left: calc(16px + constant(safe-area-inset-left));
    padding-right: calc(16px + constant(safe-area-inset-right));
  }
  
  ${props => props.isCompact && `
    margin-bottom: 6px;
    padding: 0 12px;
    padding-left: calc(12px + env(safe-area-inset-left, 0));
    padding-right: calc(12px + env(safe-area-inset-right, 0));
    
    @supports (padding-left: constant(safe-area-inset-left)) {
      padding-left: calc(12px + constant(safe-area-inset-left));
      padding-right: calc(12px + constant(safe-area-inset-right));
    }
  `}
  
  @media (max-width: 480px) {
    margin-bottom: 6px;
    padding: 0 10px;
    padding-left: calc(10px + env(safe-area-inset-left, 0));
    padding-right: calc(10px + env(safe-area-inset-right, 0));
  }
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 10px 14px;
  border-radius: ${props => props.isOutgoing ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
  background-color: ${props => props.isOutgoing ? 'var(--tg-theme-button-color, #3390EC)' : 'var(--tg-theme-bg-color, #ffffff)'};
  color: ${props => props.isOutgoing ? 'var(--tg-theme-button-text-color, #ffffff)' : 'var(--tg-theme-text-color, #000000)'};
  position: relative;
  word-wrap: break-word;
  box-shadow: ${props => props.isOutgoing ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.07), 0 1px 0 rgba(0,0,0,0.03)'};
  transition: transform 0.2s;
  border: ${props => !props.isOutgoing ? '1px solid rgba(0, 0, 0, 0.08)' : 'none'};
  
  &:active {
    transform: scale(0.98);
  }
  
  ${props => props.isCompact && `
    padding: 8px 12px;
    border-radius: ${props.isOutgoing ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
    font-size: 14px;
  `}
  
  @media (max-width: 480px) {
    max-width: 85%;
    padding: 8px 12px;
    font-size: 14px;
  }
`;

const MessageText = styled.div`
  margin-bottom: 4px;
  white-space: pre-wrap;
  line-height: 1.4;
  font-size: 15px;
  
  ${props => props.isCompact && `
    margin-bottom: 3px;
    line-height: 1.3;
    font-size: 14px;
  `}
`;

const MessageTime = styled.div`
  font-size: 11px;
  opacity: 0.7;
  text-align: right;
  margin-top: 2px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  
  ${props => props.isCompact && `
    font-size: 10px;
    margin-top: 1px;
  `}
`;

const MessageStatus = styled.span`
  margin-left: 4px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  
  ${props => props.isCompact && `
    margin-left: 3px;
  `}
`;

const ImageContainer = styled.div`
  width: 100%;
  margin-bottom: 4px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.03);
    pointer-events: none;
    z-index: 1;
  }
  
  ${props => props.isCompact && `
    margin-bottom: 3px;
    border-radius: 10px;
  `}
`;

const MessageImage = styled.img`
  width: 100%;
  max-width: 300px;
  border-radius: 12px;
  display: block;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
  }
  
  ${props => props.isCompact && `
    max-width: 250px;
    border-radius: 10px;
  `}
`;

const StickerImage = styled.img`
  width: 128px;
  height: 128px;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  ${props => props.isCompact && `
    width: 96px;
    height: 96px;
  `}
`;

const SystemMessage = styled.div`
  text-align: center;
  margin: 15px auto;
  padding: 8px 16px;
  background-color: #f0f2f5;
  color: #707579;
  border-radius: 10px;
  font-size: 13px;
  max-width: 85%;
  animation: ${fadeIn} 0.3s ease-out;
  font-weight: 500;
  
  ${props => props.isCompact && `
    margin: 10px auto;
    padding: 6px 12px;
    font-size: 12px;
  `}
`;

const TechnicalSupportHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  
  svg {
    width: 18px;
    height: 18px;
    margin-right: 8px;
    fill: #3390EC;
  }
  
  span {
    color: #3390EC;
    font-weight: 500;
    font-size: 14px;
  }
  
  ${props => props.isCompact && `
    margin-bottom: 4px;
    
    svg {
      width: 16px;
      height: 16px;
      margin-right: 6px;
    }
    
    span {
      font-size: 13px;
    }
  `}
`;

const SupportContent = styled.div`
  background-color: rgba(51, 144, 236, 0.05);
  padding: 8px 0;
  border-radius: 8px;
  margin-bottom: 8px;
  
  ${props => props.isCompact && `
    padding: 6px 0;
    margin-bottom: 6px;
  `}
`;

const ChatMessage = ({ message, isOutgoing, status }) => {
  const { text, imageUrl, timestamp, isSticker, isSystem } = message;
  const compact = isCompactMode();
  const messageRef = useRef(null);
  const isSupportMessage = !isOutgoing && text && text.includes("Техническая поддержка");

  useEffect(() => {
    // Scroll into view with a small delay to ensure animation completes
    if (messageRef.current) {
      const timer = setTimeout(() => {
        messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // For system messages (like "Chat ended" notifications)
  if (isSystem) {
    return <SystemMessage isCompact={compact} ref={messageRef}>{text}</SystemMessage>;
  }
  
  const renderSupportHeader = () => {
    if (!isSupportMessage) return null;
    
    return (
      <TechnicalSupportHeader isCompact={compact}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span>Техническая поддержка</span>
      </TechnicalSupportHeader>
    );
  };
  
  const formatSupportMessage = (text) => {
    if (!isSupportMessage) return text;
    
    // Разделяем заголовок и содержимое сообщения
    const parts = text.split("Техническая поддержка");
    if (parts.length > 1) {
      return parts[1].trim();
    }
    return text;
  };
  
  const renderMessageContent = () => {
    if (isSticker) {
      return <StickerImage src={imageUrl} alt="Sticker" isCompact={compact} />;
    }
    
    const formattedText = isSupportMessage ? formatSupportMessage(text) : text;
    
    return (
      <>
        {renderSupportHeader()}
        {imageUrl && (
          <ImageContainer isCompact={compact}>
            <MessageImage src={imageUrl} alt="Attachment" isCompact={compact} />
          </ImageContainer>
        )}
        {formattedText && <MessageText isCompact={compact}>{formattedText}</MessageText>}
        <MessageTime isCompact={compact}>
          {formatMessageTime(timestamp, compact)}
          {isOutgoing && (
            <MessageStatus isCompact={compact}>
              {status === 'sending' && '⋯'}
              {status === 'sent' && '✓'}
              {status === 'delivered' && '✓✓'}
              {status === 'read' && '✓✓'}
              {status === 'error' && '!'}
            </MessageStatus>
          )}
        </MessageTime>
      </>
    );
  };

  return (
    <MessageContainer isCompact={compact} style={{ justifyContent: isOutgoing ? 'flex-end' : 'flex-start' }} ref={messageRef}>
      <MessageBubble isOutgoing={isOutgoing} isCompact={compact}>
        {renderMessageContent()}
      </MessageBubble>
    </MessageContainer>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    text: PropTypes.string,
    imageUrl: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
    isSticker: PropTypes.bool,
    isSystem: PropTypes.bool
  }).isRequired,
  isOutgoing: PropTypes.bool.isRequired,
  status: PropTypes.oneOf(['sending', 'sent', 'delivered', 'read', 'error'])
};

ChatMessage.defaultProps = {
  status: 'sent'
};

export default ChatMessage; 
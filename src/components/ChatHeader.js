import React from 'react';
import PropTypes from 'prop-types';

const ChatHeader = ({ 
    partnerInfo, 
    isPartnerTyping, 
    isSupportChat, 
    onEndChat,
    isAdmin 
}) => {
    return (
        <div className="chat-header">
            <div className="header-left">
                <button className="back-button">
                    <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div className="chat-user-info">
                    <h2>{partnerInfo.name}</h2>
                    {isPartnerTyping ? (
                        <span className="partner-typing">печатает...</span>
                    ) : (
                        <span className="online-status">
                            {isSupportChat ? 'Всегда на связи' : 'В сети'}
                        </span>
                    )}
                </div>
            </div>
            <div className="header-actions">
                {!isSupportChat && (
                    <button className="end-chat-button" onClick={onEndChat}>
                        <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                        <span>Завершить чат</span>
                    </button>
                )}
                {isSupportChat && isAdmin && (
                    <button className="end-chat-button admin" onClick={onEndChat}>
                        <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        <span>Завершить обращение</span>
                    </button>
                )}
            </div>
        </div>
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
    isAdmin: PropTypes.bool
};

ChatHeader.defaultProps = {
    isPartnerTyping: false,
    isSupportChat: false,
    isAdmin: false
};

export default ChatHeader; 
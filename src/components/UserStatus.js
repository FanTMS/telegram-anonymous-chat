import React from 'react';
import '../styles/UserStatus.css';

const UserStatus = ({ isOnline, lastSeen, isSupportChat = false, className = '' }) => {
    if (isSupportChat) {
        return (
            <div className={`user-status support-status ${className}`}>
                <span className="status-text">Всегда на связи</span>
            </div>
        );
    }

    if (isOnline) {
        return (
            <div className={`user-status ${className}`}>
                <span className="status-indicator online"></span>
                <span className="status-text">В сети</span>
            </div>
        );
    }

    let statusText = 'Не в сети';
    if (lastSeen) {
        const now = new Date();
        const lastSeenDate = new Date(lastSeen);
        const diffMs = now - lastSeenDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) {
            statusText = 'Только что был(а) в сети';
        } else if (diffMins < 60) {
            statusText = `Был(а) в сети ${diffMins} ${diffMins === 1 ? 'минуту' : diffMins < 5 ? 'минуты' : 'минут'} назад`;
        } else if (diffHours < 24) {
            statusText = `Был(а) в сети ${diffHours} ${diffHours === 1 ? 'час' : diffHours < 5 ? 'часа' : 'часов'} назад`;
        } else {
            statusText = `Был(а) в сети ${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'} назад`;
        }
    }

    return (
        <div className={`user-status ${className}`}>
            <span className="status-indicator offline"></span>
            <span className="status-text">{statusText}</span>
        </div>
    );
};

export default UserStatus;

import React from 'react';
import { formatLastSeen } from '../utils/chatService';
import '../styles/UserStatus.css';

const UserStatus = ({ isOnline, lastSeen }) => {
    return (
        <div className="user-status">
            <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
            <span className="status-text">
                {isOnline ? 'в сети' : formatLastSeen(lastSeen)}
            </span>
        </div>
    );
};

export default UserStatus;

import React from 'react';
import { Outlet } from 'react-router-dom';
import { TelegramNavigation } from '../navigation/TelegramNavigation';
import '../../styles/navigation.css';

interface AppLayoutProps {
    hideNavigation?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ hideNavigation = false }) => {
    return (
        <div className="app-layout">
            <main className="main-content">
                <Outlet />
            </main>

            {!hideNavigation && <TelegramNavigation />}
        </div>
    );
};

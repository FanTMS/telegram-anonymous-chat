import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTelegram } from '../utils/useTelegram';
import styled from 'styled-components';
import ConnectionStatus from './ConnectionStatus';
import BottomNavigation from './BottomNavigation';

const MobileContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--tg-theme-bg-color, #fff);
`;

const SafeAreaView = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: var(--app-content-height);
  width: 100%;
  overflow: hidden;
  position: relative;
`;

const PageContent = styled.main`
  flex: 1;
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  position: relative;
  padding: var(--app-spacing-sm);
`;

const CompactHeader = styled.header`
  height: var(--app-header-height);
  min-height: var(--app-header-height);
  padding: 0 var(--app-spacing-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--tg-theme-bg-color);
  border-bottom: 1px solid var(--tg-theme-secondary-bg-color);
  position: relative;
  z-index: 10;
  flex-shrink: 0;
`;

const CompactFooter = styled.footer`
  height: var(--app-footer-height);
  min-height: var(--app-footer-height);
  padding: 0 var(--app-spacing-sm);
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: var(--tg-theme-bg-color);
  border-top: 1px solid var(--tg-theme-secondary-bg-color);
  position: relative;
  z-index: 10;
  flex-shrink: 0;
`;

// Элементы навигации
const navigationItems = [
    {
        path: '/',
        label: 'Главная',
        icon: 'home',
        includesPaths: ['/home']
    },
    {
        path: '/chats',
        label: 'Чаты',
        icon: 'chat',
        includesPaths: ['/chat/']
    },
    {
        path: '/friends',
        label: 'Друзья',
        icon: 'user-friends',
        includesPaths: ['/friends/']
    },
    {
        path: '/groups',
        label: 'Группы',
        icon: 'group',
        includesPaths: ['/groups/']
    },
    {
        path: '/profile',
        label: 'Профиль',
        icon: 'person',
        includesPaths: ['/settings']
    }
];

const AppLayout = ({ children, hideNavigation = false, title }) => {
    const { WebApp, isAvailable, supportsMethod } = useTelegram();
    const location = useLocation();

    useEffect(() => {
        if (isAvailable && WebApp) {
            try {
                if (supportsMethod('setHeaderColor')) {
                    WebApp.setHeaderColor('bg_color');
                }

                if (supportsMethod('setBackgroundColor')) {
                    WebApp.setBackgroundColor('bg_color');
                }

                if (supportsMethod('expand') && !WebApp.isExpanded) {
                    WebApp.expand();
                }

                // Set viewport height for mobile browsers
                const setVH = () => {
                    const vh = window.innerHeight * 0.01;
                    document.documentElement.style.setProperty('--vh', `${vh}px`);
                    document.documentElement.style.setProperty('--tg-viewport-stable-height', `${window.innerHeight}px`);
                };
                
                setVH();
                window.addEventListener('resize', setVH);
                
                return () => window.removeEventListener('resize', setVH);
            } catch (error) {
                console.warn('Error configuring Telegram WebApp:', error);
            }
        }
    }, [isAvailable, WebApp, supportsMethod]);

    return (
        <MobileContainer>
            <ConnectionStatus />
            {title && (
                <CompactHeader>
                    <h1 className="compact-title">{title}</h1>
                </CompactHeader>
            )}
            <SafeAreaView>
                <PageContent>
                    {children}
                </PageContent>
            </SafeAreaView>
            {!hideNavigation && (
                <CompactFooter>
                    <BottomNavigation items={navigationItems} />
                </CompactFooter>
            )}
        </MobileContainer>
    );
};

export default AppLayout;

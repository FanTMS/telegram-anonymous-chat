import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTelegram } from '../utils/useTelegram';
import styled from 'styled-components';
import ConnectionStatus from './ConnectionStatus';
import BottomNavigation from './BottomNavigation';

// Добавляем мобильный контейнер с безопасными зонами
const MobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background-color: var(--tg-theme-bg-color, #fff);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

  @media (min-width: 481px) {
    height: 100vh;
    border-radius: 0;
    border-left: 1px solid rgba(0, 0, 0, 0.1);
    border-right: 1px solid rgba(0, 0, 0, 0.1);
  }
`;

const SafeAreaView = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: calc(env(safe-area-inset-bottom, 0) + 60px); /* Добавляем высоту меню навигации */
  width: 100%;
  overflow: hidden;
  position: relative;
`;

const PageContent = styled.main`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  position: relative;
`;

// Мобильная эмуляция для десктопа
const DesktopContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #f2f2f2;
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
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

const AppLayout = ({ children, hideNavigation = false }) => {
    const { WebApp, isAvailable, supportsMethod } = useTelegram();
    const location = useLocation();

    // Использование Telegram WebApp для установки цветов
    useEffect(() => {
        if (isAvailable && WebApp) {
            try {
                // Устанавливаем цвет заголовка и фона если метод поддерживается
                if (supportsMethod('setHeaderColor')) {
                    WebApp.setHeaderColor('bg_color');
                }

                if (supportsMethod('setBackgroundColor')) {
                    WebApp.setBackgroundColor('bg_color');
                }

                // Расширяем до полного экрана
                if (supportsMethod('expand') && !WebApp.isExpanded) {
                    WebApp.expand();
                }
            } catch (error) {
                console.warn('Ошибка при настройке Telegram WebApp:', error);
            }
        }

        // Устанавливаем CSS переменные для безопасных зон
        document.documentElement.style.setProperty(
            '--safe-area-inset-top', 'env(safe-area-inset-top, 0px)'
        );
        document.documentElement.style.setProperty(
            '--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)'
        );
        document.documentElement.style.setProperty(
            '--safe-area-inset-left', 'env(safe-area-inset-left, 0px)'
        );
        document.documentElement.style.setProperty(
            '--safe-area-inset-right', 'env(safe-area-inset-right, 0px)'
        );
    }, [isAvailable, WebApp, supportsMethod]);

    return (
        <>
            <DesktopContainer />
            <MobileContainer>
                <ConnectionStatus />
                <SafeAreaView>
                    <PageContent>
                        {children}
                    </PageContent>
                </SafeAreaView>
                {!hideNavigation && <BottomNavigation items={navigationItems} />}
            </MobileContainer>
        </>
    );
};

export default AppLayout;

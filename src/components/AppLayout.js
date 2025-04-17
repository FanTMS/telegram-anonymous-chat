import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTelegram } from '../utils/useTelegram';
import styled from 'styled-components';
import ConnectionStatus from './ConnectionStatus';
import BottomNavigation from './BottomNavigation';
import { navigationItems } from '../App';
import { 
  isCompactMode, 
  applyCompactModeStyles, 
  shouldAllowScrolling, 
  applyViewportConstraints,
  getTelegramViewportDimensions
} from '../utils/telegramUtils';

// Контейнер приложения, адаптированный для компактного режима
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

  &.tg-compact-mode {
    max-width: 100%;
    box-shadow: none;
    height: calc(var(--vh, 1vh) * 100);
    /* Явно указываем отступы для устройств с "челкой" и вырезами */
    padding-top: var(--safe-area-top, env(safe-area-inset-top, 0px));
    padding-bottom: 0; /* Обработка в SafeAreaView */
    padding-left: var(--safe-area-left, env(safe-area-inset-left, 0px));  
    padding-right: var(--safe-area-right, env(safe-area-inset-right, 0px));
  }

  &[data-is-mobile="true"] {
    height: calc(var(--vh, 1vh) * 100);
    padding-top: var(--safe-area-top, env(safe-area-inset-top, 0px));
    padding-left: var(--safe-area-left, env(safe-area-inset-left, 0px));  
    padding-right: var(--safe-area-right, env(safe-area-inset-right, 0px));
  }

  @media (min-width: 481px) {
    height: 100vh;
    border-radius: 0;
    border-left: 1px solid rgba(0, 0, 0, 0.1);
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    
    &.tg-compact-mode {
      border: none;
    }
  }
`;

const SafeAreaView = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: calc(env(safe-area-inset-bottom, 0) + 60px); /* Высота меню навигации */
  width: 100%;
  overflow: hidden;
  position: relative;
  
  &.tg-compact-mode {
    padding-top: 0; /* Верхний отступ применяется к MobileContainer */
    padding-bottom: calc(var(--compact-nav-height, 50px) + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))); 
    padding-left: 0; /* Боковые отступы применяются к MobileContainer */
    padding-right: 0;
  }

  &[data-is-mobile="true"] {
    padding-top: 0;
    padding-bottom: calc(60px + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))); 
  }

  &.keyboard-visible {
    padding-bottom: var(--keyboard-height, 0px);
  }
`;

const PageContent = styled.main`
  flex: 1;
  position: relative;
  
  /* По умолчанию статичное содержимое (без прокрутки) */
  overflow: hidden;
  touch-action: none;
  
  /* Стили для прокручиваемых страниц (чаты, списки) будут добавлены через JS */
  &.scrollable {
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }
  
  &.tg-compact-mode {
    max-height: var(--tg-viewport-stable-height, calc(var(--vh, 1vh) * 100));
  }

  &[data-is-mobile="true"] {
    max-height: calc(var(--vh, 1vh) * 100);
  }

  &.keyboard-visible {
    max-height: var(--keyboard-visible-height);
  }
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

const AppLayout = ({ children, hideNavigation = false }) => {
    const { WebApp, isAvailable, supportsMethod } = useTelegram();
    const location = useLocation();
    const contentRef = useRef(null);
    const containerRef = useRef(null);
    const safeAreaViewRef = useRef(null);
    
    // Обработка изменения размера окна или переориентации
    useEffect(() => {
        const handleResize = () => {
            applyCompactModeStyles();
            
            // Получаем размеры вьюпорта Telegram
            const viewportDimensions = getTelegramViewportDimensions();
            
            // Устанавливаем CSS переменные для размеров вьюпорта
            document.documentElement.style.setProperty('--tg-viewport-width', `${viewportDimensions.width}px`);
            document.documentElement.style.setProperty('--tg-viewport-height', `${viewportDimensions.height}px`);
            document.documentElement.style.setProperty('--tg-viewport-stable-height', `${viewportDimensions.stableHeight}px`);
            
            // Устанавливаем --vh для точного расчета высоты на мобильных устройствах
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // Применяем ограничения прокрутки
            if (contentRef.current) {
                const allowScroll = shouldAllowScrolling(location.pathname);
                applyViewportConstraints(contentRef.current, allowScroll);
            }
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        // Инициализация
        handleResize();
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [location.pathname]);
    
    // Обработка изменения маршрута для нужной страницы
    useEffect(() => {
        if (contentRef.current) {
            const allowScroll = shouldAllowScrolling(location.pathname);
            applyViewportConstraints(contentRef.current, allowScroll);
        }
    }, [location.pathname]);

    // Настройка Telegram WebApp
    useEffect(() => {
        if (isAvailable && WebApp) {
            try {
                // Установка темы и цветов
                if (supportsMethod('setHeaderColor')) {
                    WebApp.setHeaderColor('bg_color');
                }

                if (supportsMethod('setBackgroundColor')) {
                    WebApp.setBackgroundColor('bg_color');
                }

                // Расширяем до полного экрана в обычном режиме
                // В компактном режиме НЕ расширяем!
                if (!isCompactMode() && supportsMethod('expand') && !WebApp.isExpanded) {
                    WebApp.expand();
                }
                
                // Настраиваем режим компактного приложения
                applyCompactModeStyles();
                
                // Добавляем классы к контейнеру
                if (containerRef.current) {
                    if (isCompactMode()) {
                        containerRef.current.classList.add('tg-compact-mode');
                    } else {
                        containerRef.current.classList.remove('tg-compact-mode');
                    }
                }
            } catch (error) {
                console.warn('Ошибка при настройке Telegram WebApp:', error);
            }
        }

        // Проверяем, является ли устройство мобильным
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Устанавливаем атрибуты для мобильных устройств
        if (isMobile) {
            document.body.setAttribute('data-is-mobile', 'true');
            
            if (containerRef.current) {
                containerRef.current.setAttribute('data-is-mobile', 'true');
            }
            
            if (safeAreaViewRef.current) {
                safeAreaViewRef.current.setAttribute('data-is-mobile', 'true');
            }
            
            if (contentRef.current) {
                contentRef.current.setAttribute('data-is-mobile', 'true');
            }
            
            // Установка vh для iOS
            const setVhProperty = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                console.log(`Установлена высота вьюпорта: --vh = ${vh}px`);
            };
            
            setVhProperty();
            window.addEventListener('resize', setVhProperty);
            window.addEventListener('orientationchange', () => {
                // Добавляем небольшую задержку для iOS
                setTimeout(setVhProperty, 300);
            });
            
            return () => {
                window.removeEventListener('resize', setVhProperty);
                window.removeEventListener('orientationchange', setVhProperty);
                document.body.removeAttribute('data-is-mobile');
            };
        }
        
        // Устанавливаем CSS переменные для безопасных зон
        document.documentElement.style.setProperty(
            '--safe-area-top', 'env(safe-area-inset-top, 0px)'
        );
        document.documentElement.style.setProperty(
            '--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)'
        );
        document.documentElement.style.setProperty(
            '--safe-area-left', 'env(safe-area-inset-left, 0px)'
        );
        document.documentElement.style.setProperty(
            '--safe-area-right', 'env(safe-area-inset-right, 0px)'
        );
        
        // Добавляем специальную обработку для iOS Safari
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            document.documentElement.classList.add('ios-device');
            
            // Фикс для iOS Safari height: 100vh
            const fixIOSSafariHeight = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                console.log(`Обновлена высота для iOS: --vh = ${vh}px`);
            };
            
            fixIOSSafariHeight();
            window.addEventListener('resize', fixIOSSafariHeight);
            return () => window.removeEventListener('resize', fixIOSSafariHeight);
        }
    }, [isAvailable, WebApp, supportsMethod, location.pathname]);

    // Получаем информацию, нужна ли прокрутка на текущей странице
    const allowScroll = shouldAllowScrolling(location.pathname);
    const isCompact = isCompactMode();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    return (
        <>
            <DesktopContainer />
            <MobileContainer 
                ref={containerRef} 
                className={isCompact ? 'tg-compact-mode' : ''}
                data-is-mobile={isMobile ? 'true' : 'false'}
            >
                <ConnectionStatus />
                <SafeAreaView 
                    ref={safeAreaViewRef}
                    className={isCompact ? 'tg-compact-mode' : ''}
                    data-is-mobile={isMobile ? 'true' : 'false'}
                >
                    <PageContent 
                        ref={contentRef} 
                        className={`${allowScroll ? 'scrollable' : ''} ${isCompact ? 'tg-compact-mode' : ''}`}
                        data-is-mobile={isMobile ? 'true' : 'false'}
                    >
                        {children}
                    </PageContent>
                </SafeAreaView>
                {!hideNavigation && (
                    <BottomNavigation 
                        items={navigationItems} 
                        isCompactMode={isCompact} 
                    />
                )}
            </MobileContainer>
        </>
    );
};

export default AppLayout;

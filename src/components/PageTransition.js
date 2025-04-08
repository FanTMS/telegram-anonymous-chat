import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { shouldAllowScrolling, applyViewportConstraints, isCompactMode } from '../utils/telegramUtils';

const TransitionContainer = styled(motion.div)`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  padding-bottom: var(--total-bottom-offset, 60px);
  
  /* Эти стили будут динамически применены через JS в зависимости от страницы */
  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  &.static {
    overflow-y: hidden;
    touch-action: none;
  }
  
  &.tg-compact-mode {
    padding-bottom: calc(50px + var(--safe-area-inset-bottom, 0px));
  }
`;

// Варианты анимации для страниц
const pageVariants = {
    initial: {
        opacity: 0,
        x: 20,
    },
    in: {
        opacity: 1,
        x: 0,
    },
    out: {
        opacity: 0,
        x: -20,
    }
};

const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3
};

const PageTransition = ({ children }) => {
    const containerRef = useRef(null);
    const location = useLocation();
    const isCompact = isCompactMode();
    
    // Определяем, должна ли страница прокручиваться
    const allowScroll = shouldAllowScrolling(location.pathname);
    
    // Применяем ограничения прокрутки при изменении маршрута или состояния компактного режима
    useEffect(() => {
        if (containerRef.current) {
            applyViewportConstraints(containerRef.current, allowScroll);
            
            // Добавляем соответствующие классы
            if (allowScroll) {
                containerRef.current.classList.add('scrollable');
                containerRef.current.classList.remove('static');
            } else {
                containerRef.current.classList.remove('scrollable');
                containerRef.current.classList.add('static');
            }
            
            // Добавляем класс для компактного режима
            if (isCompact) {
                containerRef.current.classList.add('tg-compact-mode');
            } else {
                containerRef.current.classList.remove('tg-compact-mode');
            }
        }
    }, [location.pathname, allowScroll, isCompact]);

    return (
        <TransitionContainer
            ref={containerRef}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className={`page-content ${allowScroll ? 'scrollable' : 'static'} ${isCompact ? 'tg-compact-mode' : ''}`}
        >
            {children}
        </TransitionContainer>
    );
};

export default PageTransition;

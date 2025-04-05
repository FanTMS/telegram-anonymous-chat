import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import '../styles/BeginnerGuide.css';

const BeginnerGuide = () => {
    const navigate = useNavigate();
    const [currentSection, setCurrentSection] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    const containerRef = useRef(null);

    // Эффект для отслеживания прогресса скролла
    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;

            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY;

            const scrolled = (scrollTop / (documentHeight - windowHeight)) * 100;
            setScrollProgress(scrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Настройка кнопки "Назад"
    useEffect(() => {
        try {
            if (typeof WebApp !== 'undefined' && WebApp.BackButton) {
                WebApp.BackButton.show();
                WebApp.BackButton.onClick(() => navigate(-1));

                return () => {
                    WebApp.BackButton.offClick(() => navigate(-1));
                    WebApp.BackButton.hide();
                };
            }
        } catch (error) {
            console.warn('Ошибка при настройке кнопки "Назад":', error);
        }
    }, [navigate]);

    const sections = [
        {
            title: "Добро пожаловать в анонимный чат",
            content: (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="guide-content-section"
                >
                    <div className="guide-illustration welcome-illustration">
                        <span className="guide-emoji">👋</span>
                    </div>
                    <p>Мы рады приветствовать вас в нашем анонимном чате! Здесь вы можете общаться с новыми людьми без раскрытия своей личности.</p>
                    <p>Это руководство поможет вам быстро освоиться и начать получать удовольствие от общения.</p>
                </motion.div>
            )
        },
        {
            title: "Как начать общение",
            content: (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="guide-content-section"
                >
                    <div className="guide-illustration start-illustration">
                        <span className="guide-emoji">🚀</span>
                    </div>
                    <p>Чтобы начать разговор с новым человеком:</p>
                    <ol className="guide-steps">
                        <motion.li
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            Нажмите на кнопку "Случайный чат" в главном меню
                        </motion.li>
                        <motion.li
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            Дождитесь, пока система найдет для вас собеседника
                        </motion.li>
                        <motion.li
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            Когда собеседник найден, вы можете начать беседу
                        </motion.li>
                    </ol>
                    <div className="guide-tip">
                        <span className="guide-tip-icon">💡</span>
                        <p>Хорошее приветствие увеличивает шансы на интересный разговор!</p>
                    </div>
                </motion.div>
            )
        },
        {
            title: "Советы для общения",
            content: (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="guide-content-section"
                >
                    <div className="guide-illustration tips-illustration">
                        <span className="guide-emoji">💬</span>
                    </div>
                    <p>Чтобы сделать ваше общение приятным и интересным:</p>
                    <div className="guide-cards-container">
                        <motion.div
                            className="guide-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)" }}
                        >
                            <div className="guide-card-icon">🙂</div>
                            <div className="guide-card-content">
                                <h3>Будьте вежливы</h3>
                                <p>Уважайте собеседника и его мнение</p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="guide-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)" }}
                        >
                            <div className="guide-card-icon">❓</div>
                            <div className="guide-card-content">
                                <h3>Задавайте вопросы</h3>
                                <p>Интересуйтесь мнением собеседника</p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="guide-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)" }}
                        >
                            <div className="guide-card-icon">🚫</div>
                            <div className="guide-card-content">
                                <h3>Избегайте спама</h3>
                                <p>Не отправляйте повторяющиеся сообщения</p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )
        },
        {
            title: "Правила безопасности",
            content: (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="guide-content-section"
                >
                    <div className="guide-illustration safety-illustration">
                        <span className="guide-emoji">🔒</span>
                    </div>
                    <p>Для вашей безопасности и комфортного общения:</p>
                    <ul className="guide-safety-list">
                        <motion.li
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="safety-icon">🚫</span>
                            <span>Не делитесь личной информацией</span>
                        </motion.li>
                        <motion.li
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className="safety-icon">💸</span>
                            <span>Не отправляйте деньги или подарки собеседникам</span>
                        </motion.li>
                        <motion.li
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <span className="safety-icon">⚠️</span>
                            <span>Сообщайте о нарушениях через функцию "Жалоба"</span>
                        </motion.li>
                        <motion.li
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <span className="safety-icon">🚪</span>
                            <span>Используйте кнопку "Завершить чат", если чувствуете дискомфорт</span>
                        </motion.li>
                    </ul>
                </motion.div>
            )
        }
    ];

    const nextSection = () => {
        try {
            // Haptic feedback если доступно
            if (WebApp.HapticFeedback) {
                WebApp.HapticFeedback.impactOccurred('medium');
            }
        } catch (e) {
            console.warn('Haptic feedback недоступен:', e);
        }

        if (currentSection < sections.length - 1) {
            setCurrentSection(currentSection + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/random-chat');
        }
    };

    const prevSection = () => {
        try {
            // Haptic feedback если доступно
            if (WebApp.HapticFeedback) {
                WebApp.HapticFeedback.impactOccurred('light');
            }
        } catch (e) {
            console.warn('Haptic feedback недоступен:', e);
        }

        if (currentSection > 0) {
            setCurrentSection(currentSection - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const skipGuide = () => {
        try {
            // Haptic feedback если доступно
            if (WebApp.HapticFeedback) {
                WebApp.HapticFeedback.notificationOccurred('warning');
            }
        } catch (e) {
            console.warn('Haptic feedback недоступен:', e);
        }

        navigate('/random-chat');
    };

    const progressPercent = ((currentSection + 1) / sections.length) * 100;

    return (
        <div className="beginner-guide" ref={containerRef}>
            <div className="guide-progress">
                <motion.div
                    className="guide-progress-bar"
                    initial={{ width: `${((currentSection) / sections.length) * 100}%` }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                ></motion.div>
            </div>

            <motion.h1
                className="guide-title"
                key={`title-${currentSection}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {sections[currentSection].title}
            </motion.h1>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`content-${currentSection}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="guide-content"
                >
                    {sections[currentSection].content}
                </motion.div>
            </AnimatePresence>

            <div className="guide-nav">
                {currentSection > 0 && (
                    <motion.button
                        className="guide-btn guide-btn-back"
                        onClick={prevSection}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        Назад
                    </motion.button>
                )}

                <motion.button
                    className="guide-btn guide-btn-next"
                    onClick={nextSection}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03 }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    {currentSection < sections.length - 1 ? 'Далее' : 'Начать общение'}
                </motion.button>
            </div>

            {currentSection < sections.length - 1 && (
                <motion.button
                    className="guide-btn guide-btn-skip"
                    onClick={skipGuide}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                >
                    Пропустить руководство
                </motion.button>
            )}
        </div>
    );
};

export default BeginnerGuide;

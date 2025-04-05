import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { safeHapticFeedback } from '../utils/telegramWebAppUtils';
import '../styles/BeginnerGuide.css';

const BeginnerGuide = () => {
    const navigate = useNavigate();
    const [activeFaq, setActiveFaq] = useState(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const containerRef = useRef(null);

    // Установка кнопки "Назад" в Telegram WebApp
    useEffect(() => {
        try {
            if (WebApp.isExpanded !== undefined) {
                WebApp.BackButton.show();
                WebApp.BackButton.onClick(() => navigate(-1));
            }

            return () => {
                if (WebApp.isExpanded !== undefined) {
                    WebApp.BackButton.offClick(() => navigate(-1));
                    WebApp.BackButton.hide();
                }
            };
        } catch (error) {
            console.warn('Ошибка при настройке кнопки "Назад":', error);
        }
    }, [navigate]);

    // Отслеживание прогресса скролла для прогресс-бара
    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;

            const windowHeight = window.innerHeight;
            const documentHeight = document.body.scrollHeight;
            const scrollTop = window.scrollY;

            const scrolled = (scrollTop / (documentHeight - windowHeight)) * 100;
            setScrollProgress(scrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Обработчик для FAQ аккордеона
    const toggleFaq = (index) => {
        safeHapticFeedback('selection');
        setActiveFaq(activeFaq === index ? null : index);
    };

    // Переход к поиску собеседника
    const handleStartChat = () => {
        safeHapticFeedback('impact', 'medium');
        navigate('/random-chat');
    };

    return (
        <>
            <div className="progress-container">
                <div className="progress-bar" style={{ width: `${scrollProgress}%` }}></div>
            </div>

            <div className="guide-container" ref={containerRef}>
                <div className="guide-header">
                    <h1 className="guide-title">Руководство по общению</h1>
                    <p className="guide-subtitle">
                        Узнайте, как эффективно общаться с собеседниками и получать максимум удовольствия от разговора
                    </p>
                </div>

                <div className="guide-section">
                    <h2 className="section-title">
                        <span className="section-icon">👋</span>
                        Добро пожаловать!
                    </h2>
                    <p className="guide-text">
                        Это руководство поможет вам начать общение с другими пользователями
                        в нашем анонимном чате. Здесь вы найдете полезные советы и рекомендации
                        для приятного и продуктивного общения.
                    </p>

                    <div className="guide-card">
                        <div className="guide-card-title">
                            <span className="guide-card-icon">💡</span>
                            Совет дня
                        </div>
                        <p>Будьте открыты и дружелюбны. Первое впечатление имеет большое значение в онлайн-общении!</p>
                    </div>
                </div>

                <div className="guide-section">
                    <h2 className="section-title">
                        <span className="section-icon">🚀</span>
                        Начало разговора
                    </h2>
                    <ul className="guide-list">
                        <li className="guide-list-item">Начните с дружелюбного приветствия</li>
                        <li className="guide-list-item">Задавайте открытые вопросы, требующие развернутого ответа</li>
                        <li className="guide-list-item">Проявляйте интерес к собеседнику</li>
                        <li className="guide-list-item">Избегайте слишком личных вопросов в начале беседы</li>
                        <li className="guide-list-item">Будьте вежливы и уважайте собеседника</li>
                    </ul>
                </div>

                <div className="guide-section">
                    <h2 className="section-title">
                        <span className="section-icon">💬</span>
                        Поддержание беседы
                    </h2>
                    <ul className="guide-list">
                        <li className="guide-list-item">Активно слушайте и отвечайте по существу</li>
                        <li className="guide-list-item">Делитесь своими мыслями и опытом</li>
                        <li className="guide-list-item">Избегайте односложных ответов</li>
                        <li className="guide-list-item">Не бойтесь переводить тему, если разговор заходит в тупик</li>
                        <li className="guide-list-item">Используйте эмодзи, чтобы передать эмоции и настроение</li>
                    </ul>
                </div>

                <div className="guide-section">
                    <h2 className="section-title">
                        <span className="section-icon">📝</span>
                        Правила сообщества
                    </h2>
                    <ul className="guide-list">
                        <li className="guide-list-item">Запрещено оскорбление других пользователей</li>
                        <li className="guide-list-item">Избегайте спама и рекламы</li>
                        <li className="guide-list-item">Не делитесь личной идентифицирующей информацией</li>
                        <li className="guide-list-item">Сообщайте о неприемлемом поведении через функцию «Жалоба»</li>
                        <li className="guide-list-item">Соблюдайте законы своей страны и политику Telegram</li>
                    </ul>
                </div>

                <div className="guide-section faq-section">
                    <h2 className="section-title">
                        <span className="section-icon">❓</span>
                        Часто задаваемые вопросы
                    </h2>
                    <ul className="guide-list">
                        <li
                            className={`guide-list-item ${activeFaq === 0 ? 'active' : ''}`}
                            onClick={() => toggleFaq(0)}
                        >
                            <div className="faq-question">Как найти собеседника?</div>
                            <div className="faq-answer">
                                Просто нажмите кнопку «Начать общение» или перейдите на вкладку «Поиск» в нижнем меню.
                                Система автоматически найдет вам собеседника.
                            </div>
                        </li>
                        <li
                            className={`guide-list-item ${activeFaq === 1 ? 'active' : ''}`}
                            onClick={() => toggleFaq(1)}
                        >
                            <div className="faq-question">Как завершить разговор?</div>
                            <div className="faq-answer">
                                В активном чате нажмите на меню в правом верхнем углу (⋮) и выберите «Завершить чат».
                                После этого вы и ваш собеседник не сможете больше обмениваться сообщениями.
                            </div>
                        </li>
                        <li
                            className={`guide-list-item ${activeFaq === 2 ? 'active' : ''}`}
                            onClick={() => toggleFaq(2)}
                        >
                            <div className="faq-question">Как пожаловаться на пользователя?</div>
                            <div className="faq-answer">
                                Если собеседник нарушает правила, нажмите на меню в правом верхнем углу (⋮) и выберите
                                «Пожаловаться». Укажите причину жалобы, и модераторы рассмотрят ее в ближайшее время.
                            </div>
                        </li>
                        <li
                            className={`guide-list-item ${activeFaq === 3 ? 'active' : ''}`}
                            onClick={() => toggleFaq(3)}
                        >
                            <div className="faq-question">Насколько безопасен анонимный чат?</div>
                            <div className="faq-answer">
                                Мы обеспечиваем анонимность общения — собеседники не видят вашу личную информацию.
                                Однако для безопасности не рекомендуем делиться персональными данными или контактами.
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="guide-section contact-section">
                    <h2 className="section-title" style={{ justifyContent: 'center' }}>
                        <span className="section-icon">👥</span>
                        Поддержка
                    </h2>
                    <p className="guide-text">
                        Если у вас возникли вопросы или предложения по улучшению приложения,
                        вы можете связаться с нами:
                    </p>
                    <div>
                        <button className="contact-button">
                            <span className="contact-button-icon">💬</span>
                            Чат поддержки
                        </button>
                        <button className="contact-button">
                            <span className="contact-button-icon">📮</span>
                            Оставить отзыв
                        </button>
                    </div>
                </div>

                <button
                    className="guide-button"
                    onClick={handleStartChat}
                >
                    <span className="guide-button-icon">🔎</span>
                    Начать общение
                </button>
            </div>
        </>
    );
};

export default BeginnerGuide;

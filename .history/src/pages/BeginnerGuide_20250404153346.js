import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeHapticFeedback } from '../utils/telegramUtils';
import { createSupportRequest } from '../utils/supportService';
import TableOfContents from '../components/TableOfContents';
import '../styles/BeginnerGuide.css';

const BeginnerGuide = () => {
    const navigate = useNavigate();
    const [activeFaq, setActiveFaq] = useState(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const containerRef = useRef(null);
    const [activeDialog, setActiveDialog] = useState(null);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [supportMessage, setSupportMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

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

    // Обработчик для переключения примеров диалогов
    const toggleDialog = (index) => {
        safeHapticFeedback('selection');
        setActiveDialog(activeDialog === index ? null : index);
    };

    // Переход к поиску собеседника
    const handleStartChat = () => {
        safeHapticFeedback('impact', 'medium');
        navigate('/random-chat');
    };

    // Открыть модальное окно чата поддержки
    const openSupportModal = () => {
        safeHapticFeedback('selection');
        setShowSupportModal(true);
        setSupportMessage('');
        setSubmitSuccess(false);
    };

    // Перейти на страницу поддержки пользователя
    const goToUserSupport = () => {
        safeHapticFeedback('selection');
        navigate('/support');
    };

    // Закрыть модальное окно чата поддержки
    const closeSupportModal = () => {
        setShowSupportModal(false);
    };

    // Отправка запроса в поддержку
    const submitSupportRequest = async () => {
        if (!supportMessage.trim()) return;

        try {
            setIsSubmitting(true);
            await createSupportRequest(supportMessage);
            setSubmitSuccess(true);
            setSupportMessage('');

            // Вибрация успеха
            safeHapticFeedback('notification', null, 'success');

            // Через 2 секунды закрыть модальное окно
            setTimeout(() => {
                setShowSupportModal(false);
                setSubmitSuccess(false);
            }, 2000);

        } catch (error) {
            console.error('Ошибка при отправке запроса в поддержку:', error);
            alert('Не удалось отправить запрос. Пожалуйста, попробуйте позже.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Примеры диалогов для обучения
    const dialogExamples = [
        {
            title: "Начало разговора с общей темы",
            messages: [
                { sender: "Вы", text: "Привет! Как у тебя дела сегодня?" },
                { sender: "Собеседник", text: "Привет! Все хорошо, спасибо. А у тебя?" },
                { sender: "Вы", text: "Тоже неплохо! Чем обычно занимаешься в свободное время?" },
                { sender: "Собеседник", text: "Люблю читать книги и смотреть фильмы. А ты?" },
                { sender: "Вы", text: "Интересно! Я увлекаюсь фотографией и иногда играю в компьютерные игры. Какие жанры книг тебе нравятся?" }
            ]
        },
        {
            title: "Поддержание разговора на основе общих интересов",
            messages: [
                { sender: "Собеседник", text: "Недавно посмотрел интересный фильм о космических путешествиях." },
                { sender: "Вы", text: "О, я тоже интересуюсь космосом! Какой именно фильм ты смотрел?" },
                { sender: "Собеседник", text: "«Интерстеллар». Тебе нравятся научно-фантастические фильмы?" },
                { sender: "Вы", text: "Да, очень! «Интерстеллар» один из моих любимых. А что тебе больше всего понравилось в нём?" },
                { sender: "Собеседник", text: "Визуальные эффекты и научная составляющая. А еще музыка просто потрясающая!" },
                { sender: "Вы", text: "Согласен! Ханс Циммер написал невероятный саундтрек. А какие еще фильмы в этом жанре тебе нравятся?" }
            ]
        },
        {
            title: "Как вежливо сменить тему разговора",
            messages: [
                { sender: "Собеседник", text: "...и поэтому я думаю, что математика не так уж и сложна." },
                { sender: "Вы", text: "Интересная точка зрения! Кстати, я недавно прочитал статью о влиянии музыки на работу мозга. Ты слушаешь музыку, когда учишься?" },
                { sender: "Собеседник", text: "Да, обычно что-нибудь спокойное без слов. А какую музыку ты предпочитаешь?" },
                { sender: "Вы", text: "Мне нравится инди-рок и классическая музыка. У тебя есть любимые исполнители?" }
            ]
        },
        {
            title: "Как задавать открытые вопросы",
            messages: [
                { sender: "Вы", text: "Что ты думаешь о современном искусстве?" },
                { sender: "Собеседник", text: "Оно бывает непонятным, но иногда очень впечатляет." },
                { sender: "Вы", text: "Какая художественная выставка или произведение искусства произвели на тебя самое сильное впечатление?" },
                { sender: "Собеседник", text: "Когда я был в Лувре, картина «Свобода, ведущая народ» Делакруа поразила меня своей энергией и историческим контекстом..." },
                { sender: "Вы", text: "Это действительно впечатляющая работа! Что именно в ней затронуло тебя больше всего?" }
            ]
        }
    ];

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

                <div className="guide-section dialog-examples-section">
                    <h2 className="section-title">
                        <span className="section-icon">💬</span>
                        Примеры диалогов
                    </h2>
                    <p className="guide-text">
                        Ниже приведены примеры эффективных диалогов, которые помогут вам лучше понять, как начинать и поддерживать интересную беседу.
                    </p>

                    <div className="dialog-examples">
                        {dialogExamples.map((dialog, index) => (
                            <div key={index} className={`dialog-example ${activeDialog === index ? 'active' : ''}`}>
                                <div className="dialog-example-header" onClick={() => toggleDialog(index)}>
                                    <h3 className="dialog-example-title">{dialog.title}</h3>
                                    <span className="dialog-toggle">{activeDialog === index ? '▲' : '▼'}</span>
                                </div>

                                {activeDialog === index && (
                                    <div className="dialog-messages">
                                        {dialog.messages.map((message, msgIndex) => (
                                            <div key={msgIndex} className={`dialog-message ${message.sender === 'Вы' ? 'user-message' : 'partner-message'}`}>
                                                <div className="message-sender">{message.sender}</div>
                                                <div className="message-bubble">{message.text}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
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
                        <span className="section-icon">🎯</span>
                        Советы для интересной беседы
                    </h2>
                    <div className="guide-tips">
                        <div className="guide-tip">
                            <div className="guide-tip-icon">🔍</div>
                            <div className="guide-tip-content">
                                <h3>Ищите общие интересы</h3>
                                <p>Обсуждайте хобби, фильмы, книги, музыку или игры. Найдя общий интерес, вы сможете развить глубокую и увлекательную беседу.</p>
                            </div>
                        </div>
                        <div className="guide-tip">
                            <div className="guide-tip-icon">🧠</div>
                            <div className="guide-tip-content">
                                <h3>Задавайте вопросы "почему" и "как"</h3>
                                <p>Вместо "Тебе нравится путешествовать?" спросите "Какое место тебе запомнилось больше всего и почему?".</p>
                            </div>
                        </div>
                        <div className="guide-tip">
                            <div className="guide-tip-icon">🌈</div>
                            <div className="guide-tip-content">
                                <h3>Будьте позитивны</h3>
                                <p>Оптимистичный настрой и юмор помогают создать приятную атмосферу и вызвать симпатию собеседника.</p>
                            </div>
                        </div>
                    </div>
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
                    <div className="contact-buttons">
                        <button className="contact-button" onClick={openSupportModal}>
                            <span className="contact-button-icon">💬</span>
                            Быстрый запрос
                        </button>
                        <button className="contact-button" onClick={goToUserSupport}>
                            <span className="contact-button-icon">📋</span>
                            История запросов
                        </button>
                        <button className="contact-button" onClick={() => window.open('https://t.me/anonymous_chat_support', '_blank')}>
                            <span className="contact-button-icon">📮</span>
                            Telegram-канал
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

            {/* Модальное окно для чата поддержки */}
            {showSupportModal && (
                <div className="support-modal-overlay" onClick={closeSupportModal}>
                    <div className="support-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="support-modal-header">
                            <h3>Обращение в поддержку</h3>
                            <button className="support-modal-close" onClick={closeSupportModal}>×</button>
                        </div>

                        {submitSuccess ? (
                            <div className="support-success">
                                <div className="support-success-icon">✓</div>
                                <p>Ваше обращение успешно отправлено! Мы ответим вам в ближайшее время.</p>
                            </div>
                        ) : (
                            <>
                                <div className="support-modal-content">
                                    <p>Опишите ваш вопрос или проблему, и наши специалисты ответят вам как можно скорее.</p>
                                    <textarea
                                        className="support-textarea"
                                        value={supportMessage}
                                        onChange={(e) => setSupportMessage(e.target.value)}
                                        placeholder="Введите ваше сообщение..."
                                        rows={5}
                                    />
                                </div>

                                <div className="support-modal-footer">
                                    <button
                                        className="support-submit-button"
                                        onClick={submitSupportRequest}
                                        disabled={isSubmitting || !supportMessage.trim()}
                                    >
                                        {isSubmitting ? 'Отправка...' : 'Отправить'}
                                    </button>
                                    <button
                                        className="support-cancel-button"
                                        onClick={closeSupportModal}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default BeginnerGuide;

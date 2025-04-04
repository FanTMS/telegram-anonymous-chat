import React from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

const BeginnerGuide = () => {
    const navigate = useNavigate();

    // Установка кнопки "Назад" в Telegram WebApp
    React.useEffect(() => {
        if (WebApp.isExpanded) {
            WebApp.BackButton.show();
            WebApp.BackButton.onClick(() => navigate(-1));
        }

        return () => {
            if (WebApp.isExpanded) {
                WebApp.BackButton.offClick(() => navigate(-1));
                WebApp.BackButton.hide();
            }
        };
    }, [navigate]);

    return (
        <div className="guide-container" style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '24px', textAlign: 'center' }}>Руководство по общению</h1>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ marginBottom: '12px' }}>Добро пожаловать!</h2>
                <p>
                    Это руководство поможет вам начать общение с другими пользователями
                    в нашем анонимном чате. Здесь вы найдете полезные советы и рекомендации.
                </p>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ marginBottom: '12px' }}>Начало разговора</h2>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li>Начните с дружелюбного приветствия</li>
                    <li>Задавайте открытые вопросы, требующие развернутого ответа</li>
                    <li>Проявляйте интерес к собеседнику</li>
                    <li>Избегайте слишком личных вопросов в начале беседы</li>
                    <li>Будьте вежливы и уважайте собеседника</li>
                </ul>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ marginBottom: '12px' }}>Поддержание беседы</h2>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li>Активно слушайте и отвечайте по существу</li>
                    <li>Делитесь своими мыслями и опытом</li>
                    <li>Избегайте односложных ответов</li>
                    <li>Не бойтесь переводить тему, если разговор заходит в тупик</li>
                </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
                <h2 style={{ marginBottom: '12px' }}>Правила сообщества</h2>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li>Запрещено оскорбление других пользователей</li>
                    <li>Избегайте спама и рекламы</li>
                    <li>Не делитесь личной информацией</li>
                    <li>Сообщайте о неприемлемом поведении</li>
                </ul>
            </section>

            <button
                onClick={() => navigate('/random-chat')}
                style={{
                    backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
                    color: 'var(--tg-theme-button-text-color, #ffffff)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: '16px'
                }}
            >
                Начать общение
            </button>
        </div>
    );
};

export default BeginnerGuide;

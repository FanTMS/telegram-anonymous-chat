import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BeginnerGuide.css';

const BeginnerGuide = () => {
    const navigate = useNavigate();
    const [currentSection, setCurrentSection] = useState(0);

    const sections = [
        {
            title: "Добро пожаловать в анонимный чат",
            content: (
                <>
                    <p>Мы рады приветствовать вас в нашем анонимном чате! Здесь вы можете общаться с новыми людьми без раскрытия своей личности.</p>
                    <p>Это руководство поможет вам быстро освоиться и начать получать удовольствие от общения.</p>
                </>
            )
        },
        {
            title: "Как начать общение",
            content: (
                <>
                    <p>Чтобы начать разговор с новым человеком:</p>
                    <ol>
                        <li>Нажмите на кнопку &quot;Случайный чат&quot; в главном меню</li>
                        <li>Дождитесь, пока система найдет для вас собеседника</li>
                        <li>Когда собеседник найден, вы можете начать беседу</li>
                    </ol>
                    <p>Помните, что хорошее приветствие увеличивает шансы на интересный разговор!</p>
                </>
            )
        },
        {
            title: "Советы для общения",
            content: (
                <>
                    <p>Чтобы сделать ваше общение приятным и интересным:</p>
                    <ul>
                        <li>Будьте вежливы и уважительны к собеседнику</li>
                        <li>Задавайте открытые вопросы, которые требуют развернутого ответа</li>
                        <li>Проявляйте искренний интерес к темам, которые интересны собеседнику</li>
                        <li>Делитесь своими мыслями и мнениями, но не навязывайте их</li>
                        <li>Избегайте вопросов вроде &quot;Как дела?&quot;, &quot;Откуда ты?&quot; или &quot;Чем занимаешься?&quot; - они быстро исчерпывают себя</li>
                        <li>Не бойтесь переводить тему, если разговор заходит в тупик</li>
                    </ul>
                </>
            )
        },
        {
            title: "Правила сообщества",
            content: (
                <>
                    <p>Чтобы сохранить анонимный чат безопасным и приятным для всех, соблюдайте эти правила:</p>
                    <ul>
                        <li>Запрещено оскорбление других пользователей</li>
                        <li>Избегайте спама и рекламы</li>
                        <li>Не делитесь личной информацией</li>
                        <li>Сообщайте о неприемлемом поведении через кнопку &quot;Пожаловаться&quot;</li>
                        <li>Уважайте приватность других пользователей</li>
                    </ul>
                </>
            )
        },
        {
            title: "Безопасность",
            content: (
                <>
                    <p>Для вашей безопасности:</p>
                    <ul>
                        <li>Не делитесь личной информацией, такой как полное имя, адрес, телефон</li>
                        <li>Не переходите по подозрительным ссылкам от незнакомцев</li>
                        <li>Не отправляйте деньги или подарки собеседникам</li>
                        <li>Используйте кнопку &quot;Завершить чат&quot;, если чувствуете дискомфорт</li>
                        <li>Не стесняйтесь блокировать пользователей, нарушающих правила</li>
                    </ul>
                </>
            )
        }
    ];

    const nextSection = () => {
        if (currentSection < sections.length - 1) {
            setCurrentSection(currentSection + 1);
        } else {
            navigate('/random-chat');
        }
    };

    const prevSection = () => {
        if (currentSection > 0) {
            setCurrentSection(currentSection - 1);
        }
    };

    const skipGuide = () => {
        navigate('/random-chat');
    };

    const progressPercent = ((currentSection + 1) / sections.length) * 100;

    return (
        <div className="beginner-guide">
            <div className="guide-progress">
                <div
                    className="guide-progress-bar"
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>

            <h1 className="guide-title">{sections[currentSection].title}</h1>

            <div className="guide-content">
                {sections[currentSection].content}
            </div>

            <div className="guide-nav">
                {currentSection > 0 && (
                    <button
                        className="guide-btn guide-btn-back"
                        onClick={prevSection}
                    >
                        Назад
                    </button>
                )}

                <button
                    className="guide-btn guide-btn-next"
                    onClick={nextSection}
                >
                    {currentSection < sections.length - 1 ? 'Далее' : 'Начать общение'}
                </button>
            </div>

            {currentSection < sections.length - 1 && (
                <button
                    className="guide-btn guide-btn-skip"
                    onClick={skipGuide}
                >
                    Пропустить руководство
                </button>
            )}
        </div>
    );
};

export default BeginnerGuide;

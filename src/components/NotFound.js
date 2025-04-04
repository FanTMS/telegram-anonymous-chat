import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '70vh',
            padding: '20px',
            textAlign: 'center'
        }}>
            <h2>Страница не найдена</h2>
            <p>Извините, запрошенная страница не существует.</p>
            <button
                style={{
                    padding: '10px 16px',
                    backgroundColor: '#0088cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '20px'
                }}
                onClick={() => navigate('/')}
            >
                Вернуться на главную
            </button>
        </div>
    );
};

export default NotFound;

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { createRequiredIndexes } from '../utils/firebaseIndexCreator';

const Container = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 16px;
  max-width: 300px;
  z-index: 1000;
  display: ${props => props.$visible ? 'block' : 'none'};
`;

const Title = styled.h4`
  margin-top: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
`;

const Button = styled.button`
  background-color: #0d6efd;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin-top: 8px;
  cursor: pointer;
  font-size: 14px;
  width: 100%;
  
  &:hover {
    background-color: #0b5ed7;
  }
  
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #6c757d;
  
  &:hover {
    color: #000;
  }
`;

const Status = styled.div`
  font-size: 14px;
  margin: 8px 0;
  color: ${props => props.$success ? '#198754' : props.$error ? '#dc3545' : '#6c757d'};
`;

const IndexLoader = () => {
    const [visible, setVisible] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorCount, setErrorCount] = useState(0);

    useEffect(() => {
        // Слушаем ошибки в консоли, связанные с индексами
        const originalConsoleError = console.error;

        console.error = (...args) => {
            const errorMessage = args.join(' ');
            if (errorMessage.includes('index') &&
                (errorMessage.includes('requires an index') ||
                    errorMessage.includes('failed-precondition'))) {
                setErrorCount(prev => prev + 1);
                if (errorCount >= 2) {
                    setVisible(true);
                }
            }
            originalConsoleError.apply(console, args);
        };

        return () => {
            console.error = originalConsoleError;
        };
    }, [errorCount]);

    const handleCreateIndexes = async () => {
        setStatus('loading');
        try {
            await createRequiredIndexes();
            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                setVisible(false);
            }, 3000);
        } catch (error) {
            console.error('Ошибка при создании индексов:', error);
            setStatus('error');
        }
    };

    return (
        <Container $visible={visible}>
            <CloseButton onClick={() => setVisible(false)}>×</CloseButton>
            <Title>
                <span role="img" aria-label="warning" style={{ marginRight: '8px' }}>⚠️</span>
                Требуются индексы для работы
            </Title>
            <p style={{ fontSize: '14px', margin: '8px 0' }}>
                Приложение обнаружило, что некоторые индексы для базы данных не созданы.
                Без них некоторые функции могут работать некорректно.
            </p>

            {status === 'idle' && (
                <Button onClick={handleCreateIndexes}>
                    Создать индексы
                </Button>
            )}

            {status === 'loading' && (
                <>
                    <Status>Создание индексов...</Status>
                    <Button disabled>Подождите...</Button>
                </>
            )}

            {status === 'success' && (
                <Status $success>
                    ✅ Индексы успешно запрошены! В течение нескольких минут они будут активны.
                </Status>
            )}

            {status === 'error' && (
                <>
                    <Status $error>
                        ❌ Не удалось автоматически создать индексы.
                    </Status>
                    <Button onClick={handleCreateIndexes}>
                        Попробовать снова
                    </Button>
                </>
            )}
        </Container>
    );
};

export default IndexLoader;

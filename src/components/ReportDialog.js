import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import '../styles/ReportDialog.css';

const reportReasons = [
    'Оскорбления и угрозы',
    'Спам и реклама',
    'Мошенничество',
    'Неприемлемый контент',
    'Другая причина'
];

const ReportDialog = ({ isOpen, onClose, reportedUserId, chatId, currentUserId }) => {
    const [step, setStep] = useState(1);
    const [selectedReason, setSelectedReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleReasonSelect = (reason) => {
        setSelectedReason(reason);
        setStep(2);
    };

    const handlePrevStep = () => {
        setStep(1);
    };

    const handleSubmit = async () => {
        if (!selectedReason) {
            setError('Пожалуйста, выберите причину жалобы');
            return;
        }

        if (!description || description.trim().length < 10) {
            setError('Пожалуйста, опишите ситуацию (минимум 10 символов)');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Сохраняем жалобу в базу данных
            await addDoc(collection(db, 'reports'), {
                reporterId: currentUserId,
                reportedUserId: reportedUserId,
                chatId: chatId,
                reason: selectedReason,
                description: description.trim(),
                status: 'pending',
                createdAt: serverTimestamp()
            });

            setSuccess(true);
            setIsSubmitting(false);
            
            // Через 2 секунды закрываем диалог
            setTimeout(() => {
                resetAndClose();
            }, 2000);
            
        } catch (err) {
            console.error('Ошибка при отправке жалобы:', err);
            setError('Произошла ошибка при отправке жалобы. Пожалуйста, попробуйте позже.');
            setIsSubmitting(false);
        }
    };

    const resetAndClose = () => {
        setStep(1);
        setSelectedReason('');
        setDescription('');
        setError('');
        setSuccess(false);
        onClose();
    };

    return (
        <div className="report-dialog-overlay">
            <div className="report-dialog">
                <div className="report-dialog-header">
                    <h2>{step === 1 ? 'Подать жалобу' : (success ? 'Жалоба отправлена' : 'Описание жалобы')}</h2>
                    <button className="close-button" onClick={resetAndClose}>×</button>
                </div>
                
                <div className="report-dialog-content">
                    {step === 1 && (
                        <>
                            <p className="report-dialog-description">
                                Выберите причину жалобы:
                            </p>
                            <div className="report-reasons-list">
                                {reportReasons.map((reason) => (
                                    <button
                                        key={reason}
                                        className="report-reason-button"
                                        onClick={() => handleReasonSelect(reason)}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    
                    {step === 2 && !success && (
                        <>
                            <div className="selected-reason">
                                <p><strong>Причина:</strong> {selectedReason}</p>
                                <button className="change-reason-button" onClick={handlePrevStep}>
                                    Изменить
                                </button>
                            </div>
                            
                            <p className="report-dialog-description">
                                Пожалуйста, опишите подробнее, что произошло:
                            </p>
                            
                            <textarea
                                className="report-description-input"
                                placeholder="Подробно опишите ситуацию..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                                disabled={isSubmitting}
                            />
                            
                            {error && <p className="report-error-message">{error}</p>}
                            
                            <div className="report-dialog-actions">
                                <button 
                                    className="report-cancel-button"
                                    onClick={resetAndClose}
                                    disabled={isSubmitting}
                                >
                                    Отмена
                                </button>
                                <button 
                                    className="report-submit-button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Отправка...' : 'Отправить жалобу'}
                                </button>
                            </div>
                        </>
                    )}
                    
                    {success && (
                        <div className="report-success-message">
                            <div className="success-icon">✓</div>
                            <p>Спасибо! Ваша жалоба принята на рассмотрение администрацией.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportDialog; 
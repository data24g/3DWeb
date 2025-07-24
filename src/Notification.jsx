import React from 'react';
import './Notification.css';

export function Notification({ notification, onAnswer, onClose }) {
    if (!notification) {
        return null;
    }

    const { type, message, question } = notification;

    return (
        <div className="notification-overlay" onClick={type !== 'question' ? onClose : null}>
            <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
                <h3 className="notification-title">
                    {type === 'question' ? 'CÂU HỎI THÁM HIỂM' : 'THÔNG BÁO TỪ TRUNG TÂM'}
                </h3>
                <p className="notification-message">{message || question}</p>

                {type === 'question' ? (
                    <div className="notification-actions">
                        <button className="notification-button true" onClick={() => onAnswer(true)}>ĐÚNG</button>
                        <button className="notification-button false" onClick={() => onAnswer(false)}>SAI</button>
                    </div>
                ) : (
                    <button className="notification-close-button" onClick={onClose}>
                        ĐÃ RÕ
                    </button>
                )}
            </div>
        </div>
    );
} 
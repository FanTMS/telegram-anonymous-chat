import React, { useState } from 'react';
import { scrollToElement } from '../utils/scrollUtils';
import { safeHapticFeedback } from '../utils/telegramWebAppUtils';

/**
 * Компонент для отображения оглавления с плавной прокруткой к разделам
 * @param {Array} sections - Массив объектов с id и названиями разделов
 * @returns {JSX.Element} Компонент оглавления
 */
const TableOfContents = ({ sections = [] }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSectionClick = (sectionId) => {
        safeHapticFeedback('selection');
        scrollToElement(sectionId, 600, -20);
        setIsExpanded(false);
    };

    const toggleExpand = () => {
        safeHapticFeedback('impact', 'light');
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`toc-container ${isExpanded ? 'expanded' : ''}`}>
            <div className="toc-header" onClick={toggleExpand}>
                <span className="toc-title">Содержание</span>
                <span className="toc-toggle">{isExpanded ? '▲' : '▼'}</span>
            </div>

            {isExpanded && (
                <div className="toc-sections">
                    {sections.map((section, index) => (
                        <div
                            key={index}
                            className="toc-section-item"
                            onClick={() => handleSectionClick(section.id)}
                        >
                            <span className="toc-section-number">{index + 1}</span>
                            <span className="toc-section-title">{section.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TableOfContents;

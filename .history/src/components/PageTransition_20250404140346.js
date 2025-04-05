import React from 'react';
import { useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import '../styles/PageTransition.css';

const PageTransition = ({ children }) => {
    const location = useLocation();

    return (
        <TransitionGroup className="page-transition-group">
            <CSSTransition
                key={location.pathname}
                classNames="page"
                timeout={300}
                mountOnEnter
                unmountOnExit
            >
                {children}
            </CSSTransition>
        </TransitionGroup>
    );
};

export default PageTransition;

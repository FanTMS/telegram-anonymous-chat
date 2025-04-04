import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useLocation } from 'react-router-dom';
import '../styles/PageTransition.css';

const PageTransition = ({ children }) => {
    const location = useLocation();

    return (
        <TransitionGroup component={null}>
            <CSSTransition
                key={location.key}
                timeout={300}
                classNames="page"
                unmountOnExit
            >
                {children}
            </CSSTransition>
        </TransitionGroup>
    );
};

export default PageTransition;

import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

const PageTransition = ({ children }) => {
    return (
        <TransitionGroup component={null}>
            <CSSTransition
                key={React.Children.map(children, child => child.key).join('')}
                timeout={300}
                classNames="page-transition"
                unmountOnExit
            >
                {children}
            </CSSTransition>
        </TransitionGroup>
    );
};

export default PageTransition;

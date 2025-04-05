import React from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/PageTransition.css';import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {children }) => {
    const location = useLocation(); = useLocation();
    
    return (s = {
        <div className="page-transition" key={location.pathname}>itial: {
            {children}pacity: 0,
        </div>
    );
};: {
acity: 1,
export default PageTransition;
};

export default PageTransition;

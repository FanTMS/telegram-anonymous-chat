import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
    const location = useLocation();
    
    const pageVariants = {
        initial: {
            opacity: 0,
            x: '-5%',
        },
        in: {
            opacity: 1,
            x: 0,
        },
        out: {
            opacity: 0,
            x: '5%',
        }
    };

    const pageTransition = {
        type: 'tween',
        ease: 'easeInOut',
        duration: 0.3
    };

    return (
        <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            style={{ width: '100%', height: '100%' }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;

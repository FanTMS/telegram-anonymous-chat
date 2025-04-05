import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();
  
  // Варианты анимации для появления/исчезновения страниц
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10,
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
  };
  
  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className="page-transition"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;

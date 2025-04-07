import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const TransitionContainer = styled(motion.div)`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--total-bottom-offset, 60px);
`;

// Варианты анимации для страниц
const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: -20,
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

const PageTransition = ({ children }) => {
  return (
    <TransitionContainer
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </TransitionContainer>
  );
};

export default PageTransition;

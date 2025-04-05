import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { motion } from 'framer-motion';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Варианты анимации для контейнера
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Варианты анимации для кнопок
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="home-container">
      <motion.div 
        className="welcome-section"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Привет{user?.displayName ? `, ${user.displayName}` : ''}!</h1>
        <p>Добро пожаловать в анонимный чат Telegram</p>
      </motion.div>

      <motion.div 
        className="features-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="feature-card" 
          variants={itemVariants}
          onClick={() => handleNavigate('/random-chat')}
        >
          <div className="feature-icon">
            <i className="fas fa-random"></i>
          </div>
          <div className="feature-content">
            <h3>Случайный чат</h3>
            <p>Начать общение со случайным собеседником</p>
          </div>
        </motion.div>

        <motion.div 
          className="feature-card" 
          variants={itemVariants}
          onClick={() => handleNavigate('/chats')}
        >
          <div className="feature-icon">
            <i className="fas fa-comments"></i>
          </div>
          <div className="feature-content">
            <h3>Мои чаты</h3>
            <p>Просмотр и управление активными чатами</p>
          </div>
        </motion.div>

        <motion.div 
          className="feature-card" 
          variants={itemVariants}
          onClick={() => handleNavigate('/profile')}
        >
          <div className="feature-icon">
            <i className="fas fa-user"></i>
          </div>
          <div className="feature-content">
            <h3>Мой профиль</h3>
            <p>Управление личными настройками и аватаром</p>
          </div>
        </motion.div>
        
        <motion.div 
          className="feature-card" 
          variants={itemVariants}
          onClick={() => handleNavigate('/guide')}
        >
          <div className="feature-icon">
            <i className="fas fa-book"></i>
          </div>
          <div className="feature-content">
            <h3>Руководство</h3>
            <p>Как пользоваться приложением и правила общения</p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="about-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <h3>О приложении</h3>
        <p>Анонимный чат позволяет общаться с людьми без раскрытия личной информации.
           Соблюдайте правила общения и уважайте собеседников.</p>
      </motion.div>
    </div>
  );
};

export default Home;

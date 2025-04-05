import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import './styles/global.css';

// Импорт компонентов
import RegistrationForm from './components/RegistrationForm';
import Home from './pages/Home';
import ChatsList from './pages/ChatsList';
import Chat from './pages/Chat';
import RandomChat from './pages/RandomChat';
import NotFound from './components/NotFound';
import Profile from './pages/Profile';
import AppLayout from './components/AppLayout';
import BeginnerGuide from './pages/BeginnerGuide';
import AdminSupport from './pages/AdminSupport';
import MainMenu from './components/MainMenu';

import './App.css';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<RegistrationForm />} />
          
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="chats" element={<ChatsList />} />
            <Route path="chat/:chatId" element={<Chat />} />
            <Route path="random-chat" element={<RandomChat />} />
            <Route path="profile" element={<Profile />} />
            <Route path="guide" element={<BeginnerGuide />} />
            <Route path="admin/support" element={<AdminSupport />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <MainMenu />
      </Router>
    </UserProvider>
  );
}

export default App;

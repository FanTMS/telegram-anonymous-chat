import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { ToastProvider } from './components/Toast';
import './styles/global.css';

// Импорт компонентов
import RegistrationForm from './components/RegistrationForm';
import Home from './pages/Home';
import ChatsList from './pages/ChatsList';
import Chat from './pages/Chat';
import RandomChat from './pages/RandomChat';
import NotFoundPage from './pages/NotFoundPage';
import Profile from './pages/Profile';
import AppLayout from './components/AppLayout';
import BeginnerGuide from './pages/BeginnerGuide';
import AdminSupport from './pages/AdminSupport';
import MainMenu from './components/MainMenu';
import SupportDiagnostics from './pages/SupportDiagnostics';
import PageTransition from './components/PageTransition';

import './styles/BeginnerGuide.css'; // Добавляем импорт для гарантии загрузки стилей
import './App.css';

function App() {
    const user = null; // Replace with actual user state
    const telegramUser = null; // Replace with actual telegram user state
    const isDevelopment = false; // Replace with actual environment state

    const handleRegistration = () => {
        // Replace with actual registration handler
    };

    const handleProfileUpdate = () => {
        // Replace with actual profile update handler
    };

    return (
        <ToastProvider>
            <UserProvider>
                <Router>
                    <div className="App">
                        <Routes>
                            {!user && (
                                <Route
                                    path="*"
                                    element={<RegistrationForm onSubmit={handleRegistration} telegramUser={telegramUser} isDevelopment={isDevelopment} />}
                                />
                            )}

                            {user && (
                                <Route element={<AppLayout />}>
                                    <Route path="/" element={<Navigate to="/home" replace />} />
                                    <Route path="/index.html" element={<Navigate to="/home" replace />} />
                                    <Route path="/home" element={
                                        <PageTransition>
                                            <Home user={user} />
                                        </PageTransition>
                                    } />
                                    <Route path="/chats" element={
                                        <PageTransition>
                                            <ChatsList user={user} />
                                        </PageTransition>
                                    } />
                                    <Route path="/chat/:chatId" element={
                                        <PageTransition>
                                            <Chat user={user} />
                                        </PageTransition>
                                    } />
                                    <Route path="/random-chat" element={
                                        <PageTransition>
                                            <RandomChat user={user} />
                                        </PageTransition>
                                    } />
                                    <Route path="/profile" element={
                                        <PageTransition>
                                            <Profile user={user} onUpdate={handleProfileUpdate} />
                                        </PageTransition>
                                    } />
                                    <Route path="/guide" element={
                                        <PageTransition>
                                            <BeginnerGuide />
                                        </PageTransition>
                                    } />
                                    <Route path="/admin/support" element={<AdminSupport />} />
                                    <Route path="*" element={<NotFoundPage />} />
                                </Route>
                            )}
                            <Route path="/diagnostics" element={<SupportDiagnostics />} />
                        </Routes>
                        <MainMenu />
                    </div>
                </Router>
            </UserProvider>
        </ToastProvider>
    );
}

export default App;

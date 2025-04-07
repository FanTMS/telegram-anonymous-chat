import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { ToastProvider } from './components/Toast';

// Основные компоненты
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import RandomChat from './pages/RandomChat';
import ChatsList from './pages/ChatsList';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import GroupCreate from './pages/GroupCreate';
import GroupEdit from './pages/GroupEdit';
import NotFoundPage from './pages/NotFoundPage';

// Вспомогательные компоненты
import BeginnerGuide from './components/BeginnerGuide';
import PageTransition from './components/PageTransition';
import BottomNavigation from './components/BottomNavigation';

import { testFirebaseConnection } from './utils/firebaseDebugUtils';
import './App.css';

function App() {
    useEffect(() => {
        const checkConnection = async () => {
            const isConnected = await testFirebaseConnection();
            console.log('Firebase connection status:', isConnected);
        };
        checkConnection();
    }, []);

    return (
        <UserProvider>
            <ToastProvider>
                <AppLayout>
                    <PageTransition>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/chats" element={<ChatsList />} />
                            <Route path="/chat/:id" element={<Chat />} />
                            <Route path="/random" element={<RandomChat />} />
                            <Route path="/groups" element={<Groups />} />
                            <Route path="/groups/create" element={<GroupCreate />} />
                            <Route path="/groups/:id" element={<GroupDetail />} />
                            <Route path="/groups/:id/edit" element={<GroupEdit />} />
                            <Route path="/guide" element={<BeginnerGuide />} />
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </PageTransition>
                    <BottomNavigation />
                </AppLayout>
            </ToastProvider>
        </UserProvider>
    );
}

export default App;

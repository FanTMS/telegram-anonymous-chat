import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
// Импортируйте ваши существующие страницы
// import { Home } from './pages/Home';
// import { BotChat } from './pages/BotChat';
// и другие страницы...

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Здесь добавьте ваши существующие маршруты */}
          {/* <Route index element={<Home />} /> */}
          {/* <Route path="/bot-chat" element={<BotChat />} /> */}
          {/* и другие маршруты... */}
        </Route>

        {/* Маршруты без навигации, если такие нужны */}
        <Route path="/login" element={<AppLayout hideNavigation />}>
          {/* <Route index element={<Login />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

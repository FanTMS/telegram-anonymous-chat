import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { ChatsList } from './pages/ChatsList'
import { Chat } from './pages/Chat'
import { Registration } from './pages/Registration'
import { Profile } from './pages/Profile'
import { ProfileEdit } from './pages/ProfileEdit'
import { Store } from './pages/Store'
import { UserSettings } from './pages/UserSettings'
import { RequireAuth } from './components/RequireAuth'
import { DebugPage } from './pages/Debug'
import TestChat from './pages/TestChat'

// Создаем маршрутизатор с улучшенной обработкой ошибок
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />, // Добавляем глобальную страницу ошибок
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: '/registration',
        element: <Registration />
      },
      {
        path: '/chats',
        element: (
          <RequireAuth>
            <ChatsList />
          </RequireAuth>
        )
      },
      {
        path: '/chat/:chatId',
        element: (
          <RequireAuth>
            <Chat />
          </RequireAuth>
        )
      },
      {
        path: '/profile',
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        )
      },
      {
        path: '/profile/edit',
        element: (
          <RequireAuth>
            <ProfileEdit />
          </RequireAuth>
        )
      },
      {
        path: '/store',
        element: (
          <RequireAuth>
            <Store />
          </RequireAuth>
        )
      },
      {
        path: '/settings',
        element: (
          <RequireAuth>
            <UserSettings />
          </RequireAuth>
        )
      },
      {
        path: '/debug',
        element: <DebugPage />
      },
      {
        path: '/test-chat',
        element: <TestChat />
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
])

// Страница ошибок для маршрутизации
function ErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-5 bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full mx-auto flex items-center justify-center mb-5">
          <span className="text-red-500 dark:text-red-400 text-5xl">!</span>
        </div>
        <h1 className="text-3xl font-bold text-red-500 dark:text-red-400 mb-3">Ошибка</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-5">
          Страница не найдена или произошла ошибка при загрузке
        </p>
        <a
          href="/"
          className="px-5 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-block transition"
        >
          На главную
        </a>
      </div>
    </div>
  );
}

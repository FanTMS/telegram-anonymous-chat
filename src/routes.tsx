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
// ... другие импорты

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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

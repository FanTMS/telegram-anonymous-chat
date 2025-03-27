import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Chat } from './pages/Chat'
import { Friends } from './pages/Friends'
import { Profile } from './pages/Profile'
import { AdminPanel } from './pages/admin/AdminPanel'
import { Help } from './pages/Help'
import { BeginnerGuide } from './pages/BeginnerGuide'
import { Store } from './pages/Store'
import { DatabaseReset } from './pages/DatabaseReset'
import { TelegramVerifyMock } from './pages/TelegramVerifyMock'
import { ModerationPanel } from './pages/admin/ModerationPanel'
import { GroupChats } from './pages/GroupChats'
import { GroupChatView } from './pages/GroupChatView'
import { AdminGuard } from './components/AdminGuard'
import { StoreManagement } from './pages/admin/StoreManagement'
import { BotChat } from './pages/BotChat'
import { Home } from './pages/Home'
import { UserSettings } from './pages/UserSettings'
import { getCurrentUser } from './utils/user'
import { Registration } from './pages/Registration'
import { ChatsList } from './pages/ChatsList'
import GroupsPage from './pages/GroupsPage'
import { ProfileEdit } from './pages/ProfileEdit' // Добавляем импорт нашего нового компонента
import DebugPage from './pages/Debug' // Добавьте импорт страницы отладки
import { TestChat } from './pages/TestChat' // Исправленный импорт на именованный экспорт

// Защита для авторизованных пользователей
// Теперь не перенаправляем на регистрацию, т.к. она будет на главной странице
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const currentUser = getCurrentUser()

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'settings', element: <AuthGuard><UserSettings /></AuthGuard> },
      { path: 'registration', element: <Registration /> },
      { path: 'chat/:id', element: <AuthGuard><Chat /></AuthGuard> },
      { path: 'chat', element: <AuthGuard><Chat /></AuthGuard> },
      { path: 'friends', element: <AuthGuard><Friends /></AuthGuard> },
      { path: 'profile', element: <AuthGuard><Profile /></AuthGuard> },
      { path: 'profile/edit', element: <AuthGuard><ProfileEdit /></AuthGuard> }, // Добавляем новый маршрут для редактирования профиля
      { path: 'help', element: <BeginnerGuide /> }, // Заменяем маршрут help на BeginnerGuide
      { path: 'beginner-guide', element: <BeginnerGuide /> },
      { path: 'store', element: <AuthGuard><Store /></AuthGuard> },
      { path: 'admin', element: <AdminGuard><AdminPanel /></AdminGuard> },
      // Прямые маршруты
      { path: 'direct/profile', element: <AuthGuard><Profile /></AuthGuard> },
      { path: 'direct/friends', element: <AuthGuard><Friends /></AuthGuard> },
      { path: 'direct/store', element: <AuthGuard><Store /></AuthGuard> },
      { path: 'direct/help', element: <BeginnerGuide /> }, // Заменяем маршрут direct/help на BeginnerGuide
      { path: 'direct/settings', element: <AuthGuard><UserSettings /></AuthGuard> },
      { path: 'direct/chat/:id', element: <AuthGuard><Chat /></AuthGuard> },
      { path: 'direct/chat', element: <AuthGuard><Chat /></AuthGuard> },
      { path: 'direct/admin', element: <AdminGuard><AdminPanel /></AdminGuard> },
      { path: 'moderation', element: <AdminGuard><ModerationPanel /></AdminGuard> },
      { path: 'groups', element: <AuthGuard><GroupsPage /></AuthGuard> },
      { path: 'group/:groupId', element: <AuthGuard><GroupChatView /></AuthGuard> },
      { path: 'admin/store-management', element: <AdminGuard><StoreManagement /></AdminGuard> },
      { path: 'bot-chat', element: <AuthGuard><BotChat /></AuthGuard> },
      { path: 'reset-database', element: <DatabaseReset /> },
      { path: 'verify-telegram-mock', element: <TelegramVerifyMock /> },
      { path: 'chats', element: <AuthGuard><ChatsList /></AuthGuard> },
      { path: 'direct/chats', element: <AuthGuard><Navigate to="/chats" replace /></AuthGuard> },
      { path: 'debug', element: <DebugPage /> }, // Добавьте маршрут для отладки
      { path: 'test-chat', element: <TestChat /> }, // Добавленный маршрут для тестирования чата
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]

// Создаем и экспортируем экземпляр маршрутизатора
export const router = createBrowserRouter(routes)

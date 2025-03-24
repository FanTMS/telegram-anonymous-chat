import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isAdmin } from '../utils/user'

interface AdminGuardProps {
  children: ReactNode
}

/**
 * Компонент-защитник для администратора
 * Перенаправляет на главную страницу, если пользователь не является администратором
 */
export const AdminGuard = ({ children }: AdminGuardProps) => {
  return isAdmin() ? <>{children}</> : <Navigate to="/" replace />
}

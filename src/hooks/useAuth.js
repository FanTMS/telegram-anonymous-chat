import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

/**
 * Хук для удобного доступа к информации о пользователе и его аутентификации
 * @returns {Object} Объект с данными пользователя и статусом аутентификации
 */
export const useAuth = () => {
    const { user, isAuthenticated, loading, setUser } = useContext(UserContext);

    return {
        user,
        isAuthenticated,
        loading,
        setUser
    };
};

// Add default export alongside named export to maintain backward compatibility
export default useAuth;

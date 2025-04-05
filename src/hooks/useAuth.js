import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

/**
 * Хук для удобного доступа к информации о пользователе и его аутентификации
 * @returns {Object} Объект с данными пользователя и статусом аутентификации
 */
const useAuth = () => {
    const { user, isAuthenticated, loading, setUser } = useContext(UserContext);

    return {
        user,
        isAuthenticated,
        loading,
        setUser
    };
};

export default useAuth;

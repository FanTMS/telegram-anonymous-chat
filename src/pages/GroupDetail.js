import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GroupDetailComponent from '../components/groups/GroupDetail';
import { useAuth } from '../hooks/useAuth';

/**
 * Страница детальной информации о группе
 */
const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading } = useAuth();

    // Если пользователь не авторизован, перенаправляем на страницу регистрации
    if (!loading && !isAuthenticated) {
        navigate('/register');
        return null;
    }

    return (
        <GroupDetailComponent groupId={groupId} user={user} />
    );
};

export default GroupDetail;

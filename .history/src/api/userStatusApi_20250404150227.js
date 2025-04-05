import { getUserStatus } from '../utils/chatService';

/**
 * API-обработчик для получения статуса пользователя
 * @param {Request} req Запрос Express
 * @param {Response} res Ответ Express
 */
export const getUserStatusHandler = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const status = await getUserStatus(userId);
        res.json(status);
    } catch (error) {
        console.error('Error getting user status:', error);
        res.status(500).json({ error: 'Failed to get user status' });
    }
};

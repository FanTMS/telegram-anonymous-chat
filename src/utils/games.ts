import { User, getCurrentUser, getUsers, getUserById } from './user';
import { getChatById, addSystemMessage, updateChat, Chat } from './chat';
import { getItem, setItem, getAllItems } from './dbService';

// Типы для игры "Камень-ножницы-бумага"
export type GameChoice = 'rock' | 'paper' | 'scissors';

// Интерфейс для результатов игры
export interface GameResult {
    chatId: string;
    player1Id: string;
    player2Id: string;
    player1Choice?: GameChoice;
    player2Choice?: GameChoice;
    winner?: string; // ID победителя, undefined если ничья или игра еще не завершена
    timestamp: number;
    isCompleted: boolean;
}

// Интерфейс для запроса на игру
export interface GameRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    chatId: string;
    timestamp: number;
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

// Ключ для хранения запросов на игру
const GAME_REQUESTS_KEY = 'game_requests';
// Ключ для хранения результатов игр
const GAMES_KEY = 'games';

// Получение всех запросов на игру
export const getAllGameRequests = async (): Promise<GameRequest[]> => {
    try {
        const data = await getItem(GAME_REQUESTS_KEY);
        return data || [];
    } catch (error) {
        console.error('Ошибка при получении запросов на игру:', error);
        return [];
    }
};

// Сохранение запросов на игру
const saveGameRequests = async (requests: GameRequest[]): Promise<void> => {
    try {
        await setItem(GAME_REQUESTS_KEY, requests);
    } catch (error) {
        console.error('Ошибка при сохранении запросов на игру:', error);
    }
};

// Получение всех результатов игр
export const getAllGames = async (): Promise<GameResult[]> => {
    try {
        const data = await getItem(GAMES_KEY);
        return data || [];
    } catch (error) {
        console.error('Ошибка при получении результатов игр:', error);
        return [];
    }
};

// Сохранение результатов игр
const saveGames = async (games: GameResult[]): Promise<void> => {
    try {
        await setItem(GAMES_KEY, games);
    } catch (error) {
        console.error('Ошибка при сохранении результатов игр:', error);
    }
};

// Отправка запроса на игру
export const sendGameRequest = async (toUserId: string, chatId: string): Promise<boolean> => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return false;

        // Проверяем, существует ли чат
        const chat = await getChatById(chatId);
        if (!chat) return false;

        // Проверяем, не отправлен ли уже запрос на игру в этом чате
        const requests = await getAllGameRequests();
        const existingRequest = requests.find(
            req => req.chatId === chatId &&
                (req.status === 'pending' || req.status === 'accepted') &&
                (req.fromUserId === currentUser.id || req.toUserId === currentUser.id)
        );

        if (existingRequest) {
            console.log('Запрос на игру уже отправлен или игра уже идет');
            return false;
        }

        // Создаем новый запрос
        const newRequest: GameRequest = {
            id: `greq_${Date.now()}`,
            fromUserId: currentUser.id,
            toUserId,
            chatId,
            timestamp: Date.now(),
            status: 'pending'
        };

        // Сохраняем запрос
        requests.push(newRequest);
        await saveGameRequests(requests);

        // Добавляем системное сообщение в чат
        await addSystemMessage(chatId, `${currentUser.name} предлагает сыграть в "Камень-ножницы-бумага".`);

        console.log(`Запрос на игру отправлен пользователю ${toUserId}`);
        return true;
    } catch (error) {
        console.error('Ошибка при отправке запроса на игру:', error);
        return false;
    }
};

// Получение входящих запросов на игру
export const getIncomingGameRequests = async (userId?: string): Promise<GameRequest[]> => {
    try {
        const currentUser = userId ? await getUserById(userId) : await getCurrentUser();
        if (!currentUser) return [];
        const currentId = currentUser.id;

        const requests = await getAllGameRequests();
        return requests.filter(req => req.toUserId === currentId && req.status === 'pending');
    } catch (error) {
        console.error('Ошибка при получении входящих запросов на игру:', error);
        return [];
    }
};

// Получение активных игр
export const getActiveGames = async (userId?: string): Promise<GameResult[]> => {
    try {
        const currentUser = userId ? await getUserById(userId) : await getCurrentUser();
        if (!currentUser) return [];
        const currentId = currentUser.id;

        const games = await getAllGames();
        return games.filter(
            game => (game.player1Id === currentId || game.player2Id === currentId) && !game.isCompleted
        );
    } catch (error) {
        console.error('Ошибка при получении активных игр:', error);
        return [];
    }
};

// Принятие запроса на игру
export const acceptGameRequest = async (requestId: string): Promise<boolean> => {
    try {
        const requests = await getAllGameRequests();
        const requestIndex = requests.findIndex(req => req.id === requestId);

        if (requestIndex === -1) return false;

        const request = requests[requestIndex];

        // Обновляем статус запроса
        requests[requestIndex].status = 'accepted';
        await saveGameRequests(requests);

        // Создаем новую игру
        const newGame: GameResult = {
            chatId: request.chatId,
            player1Id: request.fromUserId,
            player2Id: request.toUserId,
            timestamp: Date.now(),
            isCompleted: false
        };

        // Сохраняем игру
        const games = await getAllGames();
        games.push(newGame);
        await saveGames(games);

        // Добавляем системное сообщение в чат
        const users = await getUsers();
        const toUser = users.find(user => user.id === request.toUserId);

        if (toUser) {
            await addSystemMessage(request.chatId, `${toUser.name} принял предложение сыграть в "Камень-ножницы-бумага".`);
        }

        // Обновляем данные чата
        await updateChat(request.chatId, {
            gameRequestAccepted: true,
            gameData: newGame
        });

        console.log(`Запрос на игру с ID ${requestId} принят`);
        return true;
    } catch (error) {
        console.error('Ошибка при принятии запроса на игру:', error);
        return false;
    }
};

// Отклонение запроса на игру
export const rejectGameRequest = async (requestId: string): Promise<boolean> => {
    try {
        const requests = await getAllGameRequests();
        const requestIndex = requests.findIndex(req => req.id === requestId);

        if (requestIndex === -1) return false;

        const request = requests[requestIndex];

        // Обновляем статус запроса
        requests[requestIndex].status = 'rejected';
        await saveGameRequests(requests);

        // Добавляем системное сообщение в чат
        const users = await getUsers();
        const toUser = users.find(user => user.id === request.toUserId);

        if (toUser) {
            await addSystemMessage(request.chatId, `${toUser.name} отклонил предложение сыграть в "Камень-ножницы-бумага".`);
        }

        // Обновляем данные чата
        await updateChat(request.chatId, { gameRequestAccepted: false });

        console.log(`Запрос на игру с ID ${requestId} отклонен`);
        return true;
    } catch (error) {
        console.error('Ошибка при отклонении запроса на игру:', error);
        return false;
    }
};

// Сделать выбор в игре
export const makeGameChoice = async (gameId: string, playerId: string, choice: GameChoice): Promise<boolean> => {
    try {
        const games = await getAllGames();
        const gameIndex = games.findIndex(game =>
            game.chatId === gameId &&
            (game.player1Id === playerId || game.player2Id === playerId) &&
            !game.isCompleted
        );

        if (gameIndex === -1) return false;

        const game = games[gameIndex];

        // Определяем, какой игрок делает выбор
        if (game.player1Id === playerId) {
            game.player1Choice = choice;
        } else if (game.player2Id === playerId) {
            game.player2Choice = choice;
        } else {
            return false;
        }

        // Проверяем, сделали ли оба игрока свой выбор
        if (game.player1Choice && game.player2Choice) {
            // Определяем победителя
            if (game.player1Choice === game.player2Choice) {
                game.winner = undefined; // Ничья
            } else if (
                (game.player1Choice === 'rock' && game.player2Choice === 'scissors') ||
                (game.player1Choice === 'paper' && game.player2Choice === 'rock') ||
                (game.player1Choice === 'scissors' && game.player2Choice === 'paper')
            ) {
                game.winner = game.player1Id;
            } else {
                game.winner = game.player2Id;
            }

            // Отмечаем игру как завершенную
            game.isCompleted = true;

            // Добавляем системное сообщение в чат
            const users = await getUsers();
            const player1 = users.find(user => user.id === game.player1Id);
            const player2 = users.find(user => user.id === game.player2Id);

            if (player1 && player2) {
                // Переводим выбор на русский
                const choiceToRussian = (c: GameChoice): string => {
                    switch (c) {
                        case 'rock': return 'Камень';
                        case 'paper': return 'Бумага';
                        case 'scissors': return 'Ножницы';
                    }
                };

                let resultMessage: string;

                if (!game.winner) {
                    resultMessage = `Игра "Камень-ножницы-бумага" завершилась ничьей! Оба игрока выбрали ${choiceToRussian(game.player1Choice)}.`;
                } else {
                    const winner = game.winner === game.player1Id ? player1.name : player2.name;
                    const player1Choice = choiceToRussian(game.player1Choice);
                    const player2Choice = choiceToRussian(game.player2Choice);
                    resultMessage = `${player1.name} выбрал(a) ${player1Choice}, ${player2.name} выбрал(a) ${player2Choice}. Победил(а) ${winner}!`;
                }

                await addSystemMessage(game.chatId, resultMessage);

                // Обновляем статус запроса на игру
                const requests = await getAllGameRequests();
                const requestIndex = requests.findIndex(req =>
                    req.chatId === game.chatId &&
                    ((req.fromUserId === game.player1Id && req.toUserId === game.player2Id) ||
                        (req.fromUserId === game.player2Id && req.toUserId === game.player1Id)) &&
                    req.status === 'accepted'
                );

                if (requestIndex !== -1) {
                    requests[requestIndex].status = 'completed';
                    await saveGameRequests(requests);
                }
            }
        }

        // Сохраняем обновленные игры
        await saveGames(games);

        // Обновляем данные чата
        await updateChat(game.chatId, { gameData: game });

        return true;
    } catch (error) {
        console.error('Ошибка при выборе в игре:', error);
        return false;
    }
};

// Проверка, есть ли входящие запросы на игру
export const hasIncomingGameRequests = async (userId?: string): Promise<boolean> => {
    const requests = await getIncomingGameRequests(userId);
    return requests.length > 0;
};

// Получение активной игры для конкретного чата
export const getActiveGameForChat = async (chatId: string): Promise<GameResult | null> => {
    try {
        const games = await getAllGames();
        const activeGame = games.find(game => game.chatId === chatId && !game.isCompleted);
        return activeGame || null;
    } catch (error) {
        console.error('Ошибка при получении активной игры для чата:', error);
        return null;
    }
};

// Получение запроса на игру для конкретного чата
export const getGameRequestForChat = async (chatId: string): Promise<GameRequest | null> => {
    try {
        const requests = await getAllGameRequests();
        const request = requests.find(req =>
            req.chatId === chatId &&
            (req.status === 'pending' || req.status === 'accepted')
        );
        return request || null;
    } catch (error) {
        console.error('Ошибка при получении запроса на игру для чата:', error);
        return null;
    }
};

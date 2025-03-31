import { User, getCurrentUser, getUsers } from './user';
import { getChatById, addSystemMessage, updateChat, Chat } from './chat';

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
export const getAllGameRequests = (): GameRequest[] => {
    try {
        const data = localStorage.getItem(GAME_REQUESTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Ошибка при получении запросов на игру:', error);
        return [];
    }
};

// Сохранение запросов на игру
const saveGameRequests = (requests: GameRequest[]): void => {
    try {
        localStorage.setItem(GAME_REQUESTS_KEY, JSON.stringify(requests));
    } catch (error) {
        console.error('Ошибка при сохранении запросов на игру:', error);
    }
};

// Получение всех результатов игр
export const getAllGames = (): GameResult[] => {
    try {
        const data = localStorage.getItem(GAMES_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Ошибка при получении результатов игр:', error);
        return [];
    }
};

// Сохранение результатов игр
const saveGames = (games: GameResult[]): void => {
    try {
        localStorage.setItem(GAMES_KEY, JSON.stringify(games));
    } catch (error) {
        console.error('Ошибка при сохранении результатов игр:', error);
    }
};

// Отправка запроса на игру
export const sendGameRequest = (toUserId: string, chatId: string): boolean => {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) return false;

        // Проверяем, существует ли чат
        const chat = getChatById(chatId);
        if (!chat) return false;

        // Проверяем, не отправлен ли уже запрос на игру в этом чате
        const requests = getAllGameRequests();
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
        saveGameRequests(requests);

        // Добавляем системное сообщение в чат
        addSystemMessage(chatId, `${currentUser.name} предлагает сыграть в "Камень-ножницы-бумага".`);

        console.log(`Запрос на игру отправлен пользователю ${toUserId}`);
        return true;
    } catch (error) {
        console.error('Ошибка при отправке запроса на игру:', error);
        return false;
    }
};

// Получение входящих запросов на игру
export const getIncomingGameRequests = (userId?: string): GameRequest[] => {
    try {
        const currentId = userId || getCurrentUser()?.id;
        if (!currentId) return [];

        const requests = getAllGameRequests();
        return requests.filter(req => req.toUserId === currentId && req.status === 'pending');
    } catch (error) {
        console.error('Ошибка при получении входящих запросов на игру:', error);
        return [];
    }
};

// Получение активных игр
export const getActiveGames = (userId?: string): GameResult[] => {
    try {
        const currentId = userId || getCurrentUser()?.id;
        if (!currentId) return [];

        const games = getAllGames();
        return games.filter(
            game => (game.player1Id === currentId || game.player2Id === currentId) && !game.isCompleted
        );
    } catch (error) {
        console.error('Ошибка при получении активных игр:', error);
        return [];
    }
};

// Принятие запроса на игру
export const acceptGameRequest = (requestId: string): boolean => {
    try {
        const requests = getAllGameRequests();
        const requestIndex = requests.findIndex(req => req.id === requestId);

        if (requestIndex === -1) return false;

        const request = requests[requestIndex];

        // Обновляем статус запроса
        requests[requestIndex].status = 'accepted';
        saveGameRequests(requests);

        // Создаем новую игру
        const newGame: GameResult = {
            chatId: request.chatId,
            player1Id: request.fromUserId,
            player2Id: request.toUserId,
            timestamp: Date.now(),
            isCompleted: false
        };

        // Сохраняем игру
        const games = getAllGames();
        games.push(newGame);
        saveGames(games);

        // Добавляем системное сообщение в чат
        const users = getUsers();
        const toUser = users.find(user => user.id === request.toUserId);

        if (toUser) {
            addSystemMessage(request.chatId, `${toUser.name} принял предложение сыграть в "Камень-ножницы-бумага".`);
        }

        // Обновляем данные чата
        updateChat(request.chatId, {
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
export const rejectGameRequest = (requestId: string): boolean => {
    try {
        const requests = getAllGameRequests();
        const requestIndex = requests.findIndex(req => req.id === requestId);

        if (requestIndex === -1) return false;

        const request = requests[requestIndex];

        // Обновляем статус запроса
        requests[requestIndex].status = 'rejected';
        saveGameRequests(requests);

        // Добавляем системное сообщение в чат
        const users = getUsers();
        const toUser = users.find(user => user.id === request.toUserId);

        if (toUser) {
            addSystemMessage(request.chatId, `${toUser.name} отклонил предложение сыграть в "Камень-ножницы-бумага".`);
        }

        // Обновляем данные чата
        updateChat(request.chatId, { gameRequestAccepted: false });

        console.log(`Запрос на игру с ID ${requestId} отклонен`);
        return true;
    } catch (error) {
        console.error('Ошибка при отклонении запроса на игру:', error);
        return false;
    }
};

// Сделать выбор в игре
export const makeGameChoice = (gameId: string, playerId: string, choice: GameChoice): boolean => {
    try {
        const games = getAllGames();
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
            const users = getUsers();
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

                addSystemMessage(game.chatId, resultMessage);

                // Обновляем статус запроса на игру
                const requests = getAllGameRequests();
                const requestIndex = requests.findIndex(req =>
                    req.chatId === game.chatId &&
                    ((req.fromUserId === game.player1Id && req.toUserId === game.player2Id) ||
                        (req.fromUserId === game.player2Id && req.toUserId === game.player1Id)) &&
                    req.status === 'accepted'
                );

                if (requestIndex !== -1) {
                    requests[requestIndex].status = 'completed';
                    saveGameRequests(requests);
                }
            }
        }

        // Сохраняем обновленные игры
        saveGames(games);

        // Обновляем данные чата
        updateChat(game.chatId, { gameData: game });

        return true;
    } catch (error) {
        console.error('Ошибка при выборе в игре:', error);
        return false;
    }
};

// Проверка, есть ли входящие запросы на игру
export const hasIncomingGameRequests = (userId?: string): boolean => {
    return getIncomingGameRequests(userId).length > 0;
};

// Получение активной игры для конкретного чата
export const getActiveGameForChat = (chatId: string): GameResult | null => {
    try {
        const games = getAllGames();
        const activeGame = games.find(game => game.chatId === chatId && !game.isCompleted);
        return activeGame || null;
    } catch (error) {
        console.error('Ошибка при получении активной игры для чата:', error);
        return null;
    }
};

// Получение запроса на игру для конкретного чата
export const getGameRequestForChat = (chatId: string): GameRequest | null => {
    try {
        const requests = getAllGameRequests();
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

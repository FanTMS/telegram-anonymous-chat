import React, { useState, useEffect } from 'react';
import { Box, VStack, Heading, Text, Divider, Flex, Badge, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, getDoc, doc, onSnapshot } from 'firebase/firestore';
import NavigationBar from '../components/NavigationBar';

interface ChatPreview {
    id: string;
    lastMessage?: {
        text: string;
        timestamp: string;
    };
    unreadCount: number;
}

const ChatsPage: React.FC = () => {
    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChats = async () => {
            if (!auth.currentUser) return;

            const userId = auth.currentUser.uid;

            // Получаем все чаты, в которых участвует текущий пользователь
            const chatsQuery = query(
                collection(db, 'chats'),
                where('participants', 'array-contains', userId)
            );

            // Подписываемся на обновления списка чатов
            const unsubscribe = onSnapshot(chatsQuery, async (querySnapshot) => {
                const chatsData: ChatPreview[] = [];

                for (const document of querySnapshot.docs) {
                    const chatData = document.data();
                    const chatId = document.id;

                    // Получаем последнее сообщение чата
                    let lastMessage;
                    if (chatData.messages && chatData.messages.length > 0) {
                        const lastMsg = chatData.messages[chatData.messages.length - 1];
                        lastMessage = {
                            text: lastMsg.text,
                            timestamp: lastMsg.timestamp
                        };
                    }

                    // Проверяем непрочитанные сообщения
                    let unreadCount = 0;
                    if (chatData.unreadMessages && chatData.unreadMessages[userId]) {
                        unreadCount = chatData.unreadMessages[userId];
                    }

                    chatsData.push({
                        id: chatId,
                        lastMessage,
                        unreadCount
                    });
                }

                // Сортируем чаты по времени последнего сообщения (новые сверху)
                chatsData.sort((a, b) => {
                    if (!a.lastMessage && !b.lastMessage) return 0;
                    if (!a.lastMessage) return 1;
                    if (!b.lastMessage) return -1;

                    return new Date(b.lastMessage.timestamp).getTime() -
                        new Date(a.lastMessage.timestamp).getTime();
                });

                setChats(chatsData);
                setLoading(false);
            });

            return () => unsubscribe();
        };

        fetchChats();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();

        // Если сообщение от сегодня, показываем только время
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Иначе показываем дату
        return date.toLocaleDateString();
    };

    return (
        <Box 
            minH="100vh" 
            pt={5} 
            pb={20} 
            bg="var(--tg-theme-bg-color, white)"
            color="var(--tg-theme-text-color, black)"
        >
            <VStack spacing={4} p={4} align="stretch">
                <Heading 
                    size="lg" 
                    textAlign="center" 
                    mb={2} 
                    color="var(--tg-theme-text-color, black)"
                >
                    Ваши чаты
                </Heading>

                {loading ? (
                    <Text textAlign="center" color="var(--tg-theme-hint-color, gray.500)">
                        Загрузка чатов...
                    </Text>
                ) : chats.length === 0 ? (
                    <Text 
                        textAlign="center" 
                        color="var(--tg-theme-hint-color, gray.500)" 
                        mt={10}
                    >
                        У вас пока нет активных чатов.
                        <br />
                        Начните новый разговор на главной странице.
                    </Text>
                ) : (
                    <VStack spacing={2} align="stretch">
                        {chats.map((chat) => (
                            <Box
                                key={chat.id}
                                p={3}
                                borderRadius="md"
                                bg="var(--tg-theme-secondary-bg-color, gray.50)"
                                cursor="pointer"
                                _hover={{ 
                                    bg: "var(--tg-theme-secondary-bg-color, gray.100)", 
                                    opacity: 0.9 
                                }}
                                onClick={() => navigate(`/chat/${chat.id}`)}
                                position="relative"
                            >
                                <Flex justify="space-between" align="center">
                                    <Box>
                                        <Text 
                                            fontWeight={chat.unreadCount > 0 ? "bold" : "normal"}
                                            color="var(--tg-theme-text-color, black)"
                                        >
                                            Анонимный чат
                                        </Text>
                                        <Text 
                                            color="var(--tg-theme-hint-color, gray.500)" 
                                            fontSize="sm" 
                                            noOfLines={1}
                                        >
                                            {chat.lastMessage
                                                ? chat.lastMessage.text
                                                : 'Нет сообщений'}
                                        </Text>
                                    </Box>
                                    <Box>
                                        {chat.lastMessage && (
                                            <Text 
                                                fontSize="xs" 
                                                color="var(--tg-theme-hint-color, gray.500)"
                                            >
                                                {formatDate(chat.lastMessage.timestamp)}
                                            </Text>
                                        )}
                                        {chat.unreadCount > 0 && (
                                            <Badge
                                                bg="var(--tg-theme-button-color, blue.500)"
                                                color="var(--tg-theme-button-text-color, white)"
                                                borderRadius="full"
                                                px={2}
                                                ml={2}
                                            >
                                                {chat.unreadCount}
                                            </Badge>
                                        )}
                                    </Box>
                                </Flex>
                            </Box>
                        ))}
                    </VStack>
                )}
            </VStack>
            <NavigationBar />
        </Box>
    );
};

export default ChatsPage;

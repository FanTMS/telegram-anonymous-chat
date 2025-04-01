import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, VStack, HStack, Text, Input, IconButton,
    Flex, Avatar, useToast, Button, Spinner
} from '@chakra-ui/react';
import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';

interface Message {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
}

const ChatPage: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [otherUserId, setOtherUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        if (!chatId || !auth.currentUser) {
            navigate('/home');
            return;
        }

        const chatRef = doc(db, 'chats', chatId);

        // Получаем информацию о чате и настраиваем слушатель обновлений
        const unsubscribe = onSnapshot(chatRef, async (docSnap) => {
            if (docSnap.exists()) {
                const chatData = docSnap.data();

                // Определяем ID собеседника
                const participants = chatData.participants || [];
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const other = participants.find((id: string) => id !== currentUser.uid);
                    setOtherUserId(other || null);
                }

                // Загружаем сообщения
                const formattedMessages = (chatData.messages || []).map((msg: any, index: number) => ({
                    id: `msg-${index}`,
                    text: msg.text,
                    senderId: msg.senderId,
                    timestamp: msg.timestamp
                }));

                setMessages(formattedMessages);

                // Отмечаем, что пользователь прочитал сообщения
                if (currentUser && chatData.unreadMessages && chatData.unreadMessages[currentUser.uid] > 0) {
                    const updateData: any = { unreadMessages: { ...chatData.unreadMessages } };
                    updateData.unreadMessages[currentUser.uid] = 0;
                    await updateDoc(chatRef, updateData);
                }

                setLoading(false);

                // Прокрутка к последнему сообщению
                scrollToBottom();
            } else {
                toast({
                    title: "Чат не найден",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
                navigate('/home');
            }
        });

        return () => unsubscribe();
    }, [chatId, navigate, toast]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !chatId || !auth.currentUser) return;

        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            toast({
                title: "Ошибка при отправке сообщения",
                description: "Чат не найден",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const newMessageObj = {
            text: newMessage,
            senderId: currentUser.uid,
            timestamp: new Date().toISOString()
        };

        // Обновляем счетчик непрочитанных сообщений для другого пользователя
        const chatData = chatDoc.data();
        const unreadMessages = chatData.unreadMessages || {};
        const otherUser = chatData.participants.find((id: string) => id !== currentUser.uid);

        if (otherUser) {
            unreadMessages[otherUser] = (unreadMessages[otherUser] || 0) + 1;
        }

        // Добавляем новое сообщение в чат
        await updateDoc(chatRef, {
            messages: arrayUnion(newMessageObj),
            unreadMessages
        });

        setNewMessage('');
        scrollToBottom();
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Box h="100vh" display="flex" flexDirection="column">
            {/* Заголовок чата */}
            <Flex
                p={4}
                bg="blue.500"
                color="white"
                alignItems="center"
                justifyContent="space-between"
            >
                <IconButton
                    icon={<ArrowBackIcon />}
                    aria-label="Назад"
                    variant="ghost"
                    color="white"
                    onClick={() => navigate('/chats')}
                />
                <Text fontWeight="bold">Анонимный собеседник</Text>
                <Box w="40px"></Box> {/* Placeholder для баланса */}
            </Flex>

            {/* Область сообщений */}
            <VStack
                flex={1}
                overflowY="auto"
                p={4}
                spacing={4}
                align="stretch"
                bg="gray.50"
            >
                {loading ? (
                    <Flex justify="center" align="center" h="100%">
                        <Spinner color="blue.500" />
                    </Flex>
                ) : messages.length === 0 ? (
                    <Flex direction="column" justify="center" align="center" h="100%">
                        <Text color="gray.500" textAlign="center">
                            Начните общение прямо сейчас!
                        </Text>
                    </Flex>
                ) : (
                    messages.map((message) => {
                        const currentUser = auth.currentUser;
                        const isMyMessage = currentUser ? message.senderId === currentUser.uid : false;

                        return (
                            <Flex
                                key={message.id}
                                justify={isMyMessage ? "flex-end" : "flex-start"}
                            >
                                <Box
                                    maxW="70%"
                                    bg={isMyMessage ? "blue.500" : "white"}
                                    color={isMyMessage ? "white" : "black"}
                                    p={3}
                                    borderRadius="lg"
                                    boxShadow="sm"
                                >
                                    <Text>{message.text}</Text>
                                    <Text fontSize="xs" color={isMyMessage ? "blue.100" : "gray.500"} textAlign="right">
                                        {formatTime(message.timestamp)}
                                    </Text>
                                </Box>
                            </Flex>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </VStack>

            {/* Поле ввода сообщения */}
            <HStack p={4} bg="white" spacing={2}>
                <Input
                    placeholder="Введите сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <IconButton
                    colorScheme="blue"
                    aria-label="Отправить сообщение"
                    icon={<ArrowForwardIcon />}
                    onClick={sendMessage}
                    isDisabled={!newMessage.trim()}
                />
            </HStack>
        </Box>
    );
};

export default ChatPage;

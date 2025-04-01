import React, { useState, useEffect } from 'react';
import { Box, Heading, VStack, Button, Text, Spinner, useToast, Stack, Badge } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

interface UserData {
    id: string;
    interests?: string[];
    searchingForChat?: boolean;
    searchMode?: 'random' | 'interests';
    [key: string]: any;
}

const HomePage: React.FC = () => {
    const [isSearching, setIsSearching] = useState(false);
    const [userInterests, setUserInterests] = useState<string[]>([]);
    const [searchMode, setSearchMode] = useState<'random' | 'interests'>('random');
    const navigate = useNavigate();
    const toast = useToast();

    // Получаем интересы пользователя при загрузке страницы
    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    if (userData.interests) {
                        setUserInterests(userData.interests);
                    }
                }
            }
        };

        fetchUserData();
    }, []);

    // Функция поиска собеседника
    const startSearch = async () => {
        if (!auth.currentUser) {
            toast({
                title: "Ошибка авторизации",
                description: "Пожалуйста, войдите в систему",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsSearching(true);

        // Обновляем статус пользователя на "поиск"
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
            searchingForChat: true,
            searchMode: searchMode,
            lastSearchTime: new Date().toISOString()
        });

        // Ищем пользователей, которые тоже ищут чат
        let matchQuery;

        if (searchMode === 'random') {
            matchQuery = query(
                collection(db, 'users'),
                where('searchingForChat', '==', true),
                where('searchMode', '==', 'random')
            );
        } else {
            // Поиск по интересам
            matchQuery = query(
                collection(db, 'users'),
                where('searchingForChat', '==', true),
                where('searchMode', '==', 'interests')
            );
        }

        // Слушаем изменения в поиске чата
        const unsubscribe = onSnapshot(
            doc(db, 'users', auth.currentUser.uid),
            async (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();

                    // Если нашли активный чат
                    if (userData.activeChat) {
                        setIsSearching(false);
                        navigate(`/chat/${userData.activeChat}`);
                        unsubscribe();
                    }
                }
            }
        );

        // Пытаемся найти подходящего собеседника
        const findMatch = async () => {
            if (!auth.currentUser || !isSearching) return;

            const querySnapshot = await getDocs(matchQuery);
            const potentialMatches: UserData[] = querySnapshot.docs
                .filter(doc => doc.id !== auth.currentUser?.uid)
                .map(doc => ({ id: doc.id, ...doc.data() }));

            // Если нашли подходящего пользователя
            if (potentialMatches.length > 0) {
                let matchUser: UserData;

                if (searchMode === 'interests') {
                    // Ищем пользователя с похожими интересами
                    const matchWithInterests = potentialMatches.find(user => {
                        const userInterestsSet = new Set(user.interests || []);
                        return userInterests.some(interest => userInterestsSet.has(interest));
                    });
                    
                    matchUser = matchWithInterests || potentialMatches[0]; // Если нет совпадений по интересам, берем первого попавшегося
                } else {
                    // Для случайного поиска просто берем первого пользователя
                    matchUser = potentialMatches[0];
                }

                // Создаем чат между пользователями
                const chatId = [auth.currentUser.uid, matchUser.id].sort().join('_');
                const chatRef = doc(db, 'chats', chatId);

                await setDoc(chatRef, {
                    participants: [auth.currentUser.uid, matchUser.id],
                    createdAt: new Date().toISOString(),
                    messages: []
                });

                // Обновляем статус обоих пользователей
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    searchingForChat: false,
                    activeChat: chatId
                });

                await updateDoc(doc(db, 'users', matchUser.id), {
                    searchingForChat: false,
                    activeChat: chatId
                });

                // Переходим к чату
                setIsSearching(false);
                navigate(`/chat/${chatId}`);
                unsubscribe();
            } else {
                // Если совпадений нет, пробуем через 2 секунды
                setTimeout(findMatch, 2000);
            }
        };

        findMatch();

        // Функция отмены поиска
        return () => {
            if (auth.currentUser) {
                updateDoc(userRef, {
                    searchingForChat: false
                });
            }
            unsubscribe();
        };
    };

    const cancelSearch = async () => {
        if (auth.currentUser) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                searchingForChat: false
            });
        }
        setIsSearching(false);
    };

    return (
        <Box minH="100vh" pt={5} pb={16}>
            <VStack spacing={6} p={4}>
                <Heading size="lg">Анонимный чат</Heading>

                {isSearching ? (
                    <VStack spacing={4} w="100%" p={6} bg="gray.50" borderRadius="md">
                        <Spinner size="xl" color="blue.500" />
                        <Text>Поиск собеседника...</Text>
                        <Button colorScheme="red" onClick={cancelSearch}>Отменить поиск</Button>
                    </VStack>
                ) : (
                    <VStack spacing={5} w="100%">
                        <Text fontSize="md" textAlign="center">
                            Выберите способ поиска собеседника
                        </Text>

                        <Stack direction="row" spacing={4}>
                            <Button
                                colorScheme={searchMode === 'random' ? "blue" : "gray"}
                                onClick={() => setSearchMode('random')}
                                flex={1}
                            >
                                Случайный
                            </Button>
                            <Button
                                colorScheme={searchMode === 'interests' ? "blue" : "gray"}
                                onClick={() => setSearchMode('interests')}
                                flex={1}
                            >
                                По интересам
                            </Button>
                        </Stack>

                        {searchMode === 'interests' && (
                            <Box w="100%">
                                <Text mb={2} fontWeight="medium">Ваши интересы:</Text>
                                <Box>
                                    {userInterests.length > 0 ? (
                                        userInterests.map((interest, index) => (
                                            <Badge key={index} m={1} colorScheme="blue">{interest}</Badge>
                                        ))
                                    ) : (
                                        <Text color="gray.500">
                                            У вас не указаны интересы. Поиск может быть менее эффективным.
                                        </Text>
                                    )}
                                </Box>
                            </Box>
                        )}

                        <Button
                            colorScheme="blue"
                            size="lg"
                            w="100%"
                            onClick={startSearch}
                        >
                            Начать поиск
                        </Button>
                    </VStack>
                )}
            </VStack>
            <NavigationBar />
        </Box>
    );
};

export default HomePage;

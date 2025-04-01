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
    const [userName, setUserName] = useState<string>('');
    const navigate = useNavigate();
    const toast = useToast();

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
                    if (userData.displayName) {
                        setUserName(userData.displayName);
                    } else {
                        setUserName(auth.currentUser.email?.split('@')[0] || 'Пользователь');
                    }
                }
            }
        };

        fetchUserData();
        console.log('HomePage component loaded');
    }, []);

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

        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
            searchingForChat: true,
            searchMode: searchMode,
            lastSearchTime: new Date().toISOString()
        });

        let matchQuery;

        if (searchMode === 'random') {
            matchQuery = query(
                collection(db, 'users'),
                where('searchingForChat', '==', true),
                where('searchMode', '==', 'random')
            );
        } else {
            matchQuery = query(
                collection(db, 'users'),
                where('searchingForChat', '==', true),
                where('searchMode', '==', 'interests')
            );
        }

        const unsubscribe = onSnapshot(
            doc(db, 'users', auth.currentUser.uid),
            async (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();

                    if (userData.activeChat) {
                        setIsSearching(false);
                        navigate(`/chat/${userData.activeChat}`);
                        unsubscribe();
                    }
                }
            }
        );

        const findMatch = async () => {
            if (!auth.currentUser || !isSearching) return;

            const querySnapshot = await getDocs(matchQuery);
            const potentialMatches = querySnapshot.docs
                .filter(doc => doc.id !== auth.currentUser?.uid)
                .map(doc => {
                    const data = doc.data() as Record<string, any>;
                    return { id: doc.id, ...data } as UserData;
                });

            if (potentialMatches.length > 0) {
                let matchUser: UserData;

                if (searchMode === 'interests') {
                    const matchWithInterests = potentialMatches.find(user => {
                        const userInterestsSet = new Set(user.interests || []);
                        return userInterests.some(interest => userInterestsSet.has(interest));
                    });

                    matchUser = matchWithInterests || potentialMatches[0];
                } else {
                    matchUser = potentialMatches[0];
                }

                const chatId = [auth.currentUser.uid, matchUser.id].sort().join('_');
                const chatRef = doc(db, 'chats', chatId);

                await setDoc(chatRef, {
                    participants: [auth.currentUser.uid, matchUser.id],
                    createdAt: new Date().toISOString(),
                    messages: []
                });

                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    searchingForChat: false,
                    activeChat: chatId
                });

                await updateDoc(doc(db, 'users', matchUser.id), {
                    searchingForChat: false,
                    activeChat: chatId
                });

                setIsSearching(false);
                navigate(`/chat/${chatId}`);
                unsubscribe();
            } else {
                setTimeout(findMatch, 2000);
            }
        };

        findMatch();

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
        <Box 
            minH="100vh" 
            pt={5} 
            pb={20}
            bg="var(--tg-theme-bg-color, white)"
            color="var(--tg-theme-text-color, black)"
        >
            <VStack spacing={6} p={4}>
                <Heading size="lg" color="var(--tg-theme-text-color, black)">Анонимный чат</Heading>

                <Text fontSize="md" color="var(--tg-theme-text-color, black)">
                    Привет, {userName}! Найди собеседника уже сейчас.
                </Text>

                {userInterests.length === 0 && (
                    <Box
                        p={4}
                        bg="var(--tg-theme-secondary-bg-color, blue.50)"
                        borderRadius="md"
                        w="100%"
                        mb={2}
                    >
                        <Text mb={2} color="var(--tg-theme-text-color, black)">
                            Вы еще не указали свои интересы. Это поможет найти собеседника по схожим темам.
                        </Text>
                        <Button
                            size="sm"
                            variant="telegram"
                            onClick={() => navigate('/interests')}
                        >
                            Указать интересы
                        </Button>
                    </Box>
                )}

                {isSearching ? (
                    <VStack 
                        spacing={4} 
                        w="100%" 
                        p={6} 
                        bg="var(--tg-theme-secondary-bg-color, gray.50)" 
                        borderRadius="md"
                    >
                        <Spinner size="xl" color="var(--tg-theme-button-color, blue.500)" />
                        <Text color="var(--tg-theme-text-color, black)">Поиск собеседника...</Text>
                        <Button variant="telegram" onClick={cancelSearch}>Отменить поиск</Button>
                    </VStack>
                ) : (
                    <VStack spacing={5} w="100%">
                        <Text fontSize="md" textAlign="center" color="var(--tg-theme-text-color, black)">
                            Выберите способ поиска собеседника
                        </Text>

                        <Stack direction="row" spacing={4}>
                            <Button
                                variant={searchMode === 'random' ? "telegram" : "outline"}
                                onClick={() => setSearchMode('random')}
                                flex={1}
                            >
                                Случайный
                            </Button>
                            <Button
                                variant={searchMode === 'interests' ? "telegram" : "outline"}
                                onClick={() => setSearchMode('interests')}
                                flex={1}
                            >
                                По интересам
                            </Button>
                        </Stack>

                        {searchMode === 'interests' && (
                            <Box 
                                w="100%" 
                                p={3} 
                                bg="var(--tg-theme-secondary-bg-color, gray.50)" 
                                borderRadius="md"
                            >
                                <Text mb={2} fontWeight="medium" color="var(--tg-theme-text-color, black)">
                                    Ваши интересы:
                                </Text>
                                <Box>
                                    {userInterests.length > 0 ? (
                                        userInterests.map((interest, index) => (
                                            <Badge 
                                                key={index} 
                                                m={1} 
                                                bg="var(--tg-theme-button-color, blue.500)"
                                                color="var(--tg-theme-button-text-color, white)"
                                            >
                                                {interest}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Text color="var(--tg-theme-hint-color, gray.500)">
                                            У вас не указаны интересы. Поиск может быть менее эффективным.
                                        </Text>
                                    )}
                                </Box>
                            </Box>
                        )}

                        <Button
                            variant="telegram"
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

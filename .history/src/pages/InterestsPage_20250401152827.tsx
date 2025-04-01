import React, { useState, useEffect } from 'react';
import { Box, Container, Heading, SimpleGrid, Checkbox, Button, Text, useToast, VStack } from '@chakra-ui/react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface InterestOption {
    id: string;
    label: string;
}

const InterestsPage: React.FC = () => {
    const [interests, setInterests] = useState<InterestOption[]>([]);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const toast = useToast();
    const navigate = useNavigate();

    // Получаем список возможных интересов
    useEffect(() => {
        const fetchInterests = async () => {
            try {
                // Здесь должен быть код для получения интересов из базы данных
                // Например:
                const interestsData: InterestOption[] = [
                    { id: 'sports', label: 'Спорт' },
                    { id: 'music', label: 'Музыка' },
                    { id: 'art', label: 'Искусство' },
                    { id: 'tech', label: 'Технологии' },
                    { id: 'movies', label: 'Фильмы' },
                    { id: 'books', label: 'Книги' },
                    { id: 'travel', label: 'Путешествия' },
                    { id: 'cooking', label: 'Кулинария' },
                    { id: 'gaming', label: 'Игры' },
                    { id: 'fashion', label: 'Мода' },
                ];

                setInterests(interestsData);

                // Если пользователь уже выбирал интересы, загружаем их
                if (auth.currentUser) {
                    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                    if (userDoc.exists() && userDoc.data().interests) {
                        setSelectedInterests(userDoc.data().interests);
                    }
                }
            } catch (error) {
                console.error('Error fetching interests:', error);
            }
        };

        fetchInterests();
    }, []);

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleSaveInterests = async () => {
        if (!auth.currentUser) return;

        setLoading(true);

        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                interests: selectedInterests
            });

            toast({
                title: "Интересы сохранены",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Перенаправляем на главную страницу
            navigate('/home');
        } catch (error) {
            console.error('Error updating interests:', error);
            toast({
                title: "Ошибка при сохранении",
                description: "Пожалуйста, попробуйте еще раз",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }

        setLoading(false);
    };

    return (
        <Container maxW="container.md" py={8}>
            <VStack spacing={8}>
                <Heading as="h1" size="xl">Выберите ваши интересы</Heading>
                <Text>Выберите темы, которые вам интересны</Text>

                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} width="100%">
                    {interests.map(interest => (
                        <Checkbox
                            key={interest.id}
                            isChecked={selectedInterests.includes(interest.id)}
                            onChange={() => toggleInterest(interest.id)}
                            colorScheme="blue"
                            size="lg"
                        >
                            {interest.label}
                        </Checkbox>
                    ))}
                </SimpleGrid>

                <Button
                    colorScheme="blue"
                    size="lg"
                    width="100%"
                    onClick={handleSaveInterests}
                    isLoading={loading}
                >
                    Сохранить интересы
                </Button>
            </VStack>
        </Container>
    );
};

export default InterestsPage;

import React, { useState } from 'react';
import { Box, Button, Container, FormControl, FormLabel, Heading, Input, Text, VStack, useToast, Link } from '@chakra-ui/react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                title: "Пароли не совпадают",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setLoading(true);

        try {
            // Создаем пользователя в Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Создаем документ пользователя в Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                createdAt: new Date().toISOString(),
                interests: [],
                searchingForChat: false
            });

            toast({
                title: "Регистрация успешна",
                description: "Добро пожаловать!",
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            // Перенаправляем на страницу интересов
            navigate('/interests');
        } catch (error: any) {
            let errorMessage = "Ошибка регистрации";

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Этот email уже зарегистрирован";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Некорректный email";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Слишком слабый пароль";
            }

            toast({
                title: "Ошибка",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }

        setLoading(false);
    };

    return (
        <Container maxW="md" py={10}>
            <VStack spacing={8}>
                <Heading>Регистрация</Heading>

                <Box as="form" width="100%" onSubmit={handleRegister}>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Email</FormLabel>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Введите ваш email"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Пароль</FormLabel>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Введите пароль"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Подтвердите пароль</FormLabel>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Введите пароль еще раз"
                            />
                        </FormControl>

                        <Button
                            width="100%"
                            colorScheme="blue"
                            type="submit"
                            isLoading={loading}
                            mt={4}
                        >
                            Зарегистрироваться
                        </Button>
                    </VStack>
                </Box>

                <Text>
                    Уже есть аккаунт?{" "}
                    <Link as={RouterLink} to="/login" color="blue.500">
                        Войти
                    </Link>
                </Text>
            </VStack>
        </Container>
    );
};

export default RegisterPage;

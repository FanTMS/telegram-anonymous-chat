import React, { useState } from 'react';
import { Box, Button, Container, FormControl, FormLabel, Heading, Input, Text, VStack, useToast, Link } from '@chakra-ui/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);

            toast({
                title: "Вход выполнен",
                description: "Добро пожаловать!",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Перенаправляем на главную страницу
            navigate('/home');
        } catch (error: any) {
            let errorMessage = "Ошибка входа";

            if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Неверный email или пароль";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Слишком много попыток входа. Попробуйте позже";
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
                <Heading>Вход</Heading>

                <Box as="form" width="100%" onSubmit={handleLogin}>
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

                        <Button
                            width="100%"
                            colorScheme="blue"
                            type="submit"
                            isLoading={loading}
                            mt={4}
                        >
                            Войти
                        </Button>
                    </VStack>
                </Box>

                <Text>
                    Нет аккаунта?{" "}
                    <Link as={RouterLink} to="/register" color="blue.500">
                        Зарегистрироваться
                    </Link>
                </Text>
            </VStack>
        </Container>
    );
};

export default LoginPage;

import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaComments, FaCog } from 'react-icons/fa';

interface NavigationBarProps {
    showSettings?: boolean;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ showSettings = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname.startsWith(path);

    // Используем CSS переменные Telegram для стилей
    return (
        <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg="var(--tg-theme-bg-color, white)"
            borderTop="1px solid"
            borderColor="var(--tg-theme-hint-color, gray.200)"
            zIndex={10}
            pb="env(safe-area-inset-bottom)" // Для поддержки iPhone с челкой
            style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 2px)', // Дополнительный отступ для Telegram
            }}
            boxShadow="0px -2px 5px rgba(0, 0, 0, 0.05)"
        >
            <Flex justify="space-around" align="center" h="60px">
                <Flex
                    direction="column"
                    align="center"
                    onClick={() => navigate('/home')}
                    cursor="pointer"
                    color={isActive('/home') ? 'telegram.button' : 'telegram.hint'}
                    transition="color 0.3s"
                    flex={1}
                >
                    <FaHome size={22} />
                    <Text fontSize="xs" mt={1}>Главная</Text>
                </Flex>

                <Flex
                    direction="column"
                    align="center"
                    onClick={() => navigate('/chats')}
                    cursor="pointer"
                    color={isActive('/chat') ? 'telegram.button' : 'telegram.hint'}
                    transition="color 0.3s"
                    flex={1}
                >
                    <FaComments size={22} />
                    <Text fontSize="xs" mt={1}>Чаты</Text>
                </Flex>

                {showSettings && (
                    <Flex
                        direction="column"
                        align="center"
                        onClick={() => navigate('/interests')}
                        cursor="pointer"
                        color={isActive('/interests') ? 'telegram.button' : 'telegram.hint'}
                        transition="color 0.3s"
                        flex={1}
                    >
                        <FaCog size={22} />
                        <Text fontSize="xs" mt={1}>Интересы</Text>
                    </Flex>
                )}
            </Flex>
        </Box>
    );
};

export default NavigationBar;

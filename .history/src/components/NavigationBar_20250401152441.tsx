import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaComments } from 'react-icons/fa';

const NavigationBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box 
      position="fixed" 
      bottom={0} 
      left={0} 
      right={0} 
      bg="white" 
      borderTop="1px solid" 
      borderColor="gray.200"
      zIndex={10}
      pb={2} // Дополнительный отступ для Telegram mini app
    >
      <Flex justify="space-around" align="center" h="60px">
        <Flex 
          direction="column" 
          align="center" 
          onClick={() => navigate('/home')} 
          cursor="pointer"
          color={isActive('/home') ? 'blue.500' : 'gray.500'}
          transition="color 0.3s"
        >
          <FaHome size={24} />
          <Text fontSize="xs" mt={1}>Главная</Text>
        </Flex>

        <Flex 
          direction="column" 
          align="center" 
          onClick={() => navigate('/chats')} 
          cursor="pointer"
          color={isActive('/chats') ? 'blue.500' : 'gray.500'}
          transition="color 0.3s"
        >
          <FaComments size={24} />
          <Text fontSize="xs" mt={1}>Чаты</Text>
        </Flex>
      </Flex>
    </Box>
  );
};

export default NavigationBar;

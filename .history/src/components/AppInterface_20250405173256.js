import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

const AppInterface = ({ user, onLogout, onShowTutorial }) => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Анонимный чат
                </Typography>
                <Button color="inherit" onClick={onShowTutorial}>
                    Руководство
                </Button>
                <Button color="inherit" onClick={onLogout}>
                    Выйти
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default AppInterface;
import React, { useState, useContext } from 'react';
import { 
  AppBar, 
  Box,
  Drawer,
  IconButton, 
  Toolbar, 
  Typography, 
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  CloudUpload as UploadIcon,
  PhotoLibrary as GalleryIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { ColorModeContext } from '../App';

const Navigation: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const colorMode = useContext(ColorModeContext);

  const menuItems = [
    {
      text: 'Главная',
      icon: <HomeIcon />,
      path: '/'
    },
    {
      text: 'Загрузить изображение',
      icon: <UploadIcon />,
      path: '/upload'
    },
    {
      text: 'Галерея',
      icon: <GalleryIcon />,
      path: '/'
    }
  ];

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <>
      <AppBar position="static">
        <Container maxWidth={false}>
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Система управления изображениями
            </Typography>
            <Tooltip title={colorMode.mode === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}>
              <IconButton color="inherit" onClick={colorMode.toggleColorMode}>
                {colorMode.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Навигация
            </Typography>
            <IconButton onClick={colorMode.toggleColorMode} size="small">
              {colorMode.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Box>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem 
                key={item.text} 
                component={Link} 
                to={item.path}
                sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navigation;
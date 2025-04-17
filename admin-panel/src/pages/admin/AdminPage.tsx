import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tab,
  Tabs,
  Paper,
  Divider
} from '@mui/material';
import { 
  PeopleAlt as UsersIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import UserManagement from '../../components/admin/UserManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminPage: React.FC = () => {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // If not authenticated or not an admin, redirect to login
  if (!isInitializing && (!isAuthenticated || (user && user.role !== UserRole.ADMIN))) {
    return <Navigate to="/" />;
  }

  // Show empty div while initializing
  if (isInitializing) {
    return <div></div>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Администрирование
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Управление пользователями и настройками системы
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin tabs"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab 
              label="Пользователи" 
              icon={<UsersIcon />} 
              iconPosition="start" 
              {...a11yProps(0)} 
            />
            <Tab 
              label="Настройки системы" 
              icon={<SettingsIcon />} 
              iconPosition="start" 
              {...a11yProps(1)} 
            />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <UserManagement />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box p={2}>
            <Typography variant="h6" gutterBottom>
              Настройки системы
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Typography color="text.secondary">
              Данный раздел находится в разработке. Здесь будут размещены настройки для управления системой.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminPage;
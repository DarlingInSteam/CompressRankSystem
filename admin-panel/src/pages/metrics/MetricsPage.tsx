import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Tabs,
  Tab,
  LinearProgress,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  ButtonGroup
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Типы для Recharts
interface PieChartData {
  name: string;
  value: number;
}

interface LineChartData {
  date: string;
  uploads?: number;
  views?: number;
  downloads?: number;
  efficiency?: number;
  spaceUsed?: number;
  spaceSaved?: number;
  compressed?: number;
}

// Имитация данных для демонстрации
const generateRandomData = (count: number): LineChartData[] => {
  const result = [];
  let date = new Date();
  
  for (let i = 0; i < count; i++) {
    result.push({
      date: new Date(date.setDate(date.getDate() - 1)).toLocaleDateString(),
      uploads: Math.floor(Math.random() * 50) + 10,
      compressed: Math.floor(Math.random() * 40) + 5,
      views: Math.floor(Math.random() * 100) + 20,
      downloads: Math.floor(Math.random() * 30) + 5,
      spaceUsed: Math.floor(Math.random() * 200) + 100,
      spaceSaved: Math.floor(Math.random() * 100) + 50,
    });
  }
  return result.reverse();
};

// Цвета для графиков
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Имитация данных о типах изображений
const imageTypesData: PieChartData[] = [
  { name: 'JPEG', value: 60 },
  { name: 'PNG', value: 25 },
  { name: 'WebP', value: 10 },
  { name: 'GIF', value: 5 }
];

// Имитация данных о степени сжатия
const compressionRateData: PieChartData[] = [
  { name: 'Высокая (>70%)', value: 35 },
  { name: 'Средняя (40-70%)', value: 45 },
  { name: 'Низкая (<40%)', value: 20 }
];

// Интерфейсы для разных типов временных периодов
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`metrics-tabpanel-${index}`}
      aria-labelledby={`metrics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const MetricsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('week');
  const [activityData, setActivityData] = useState<LineChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Имитация загрузки данных
    setIsLoading(true);
    
    setTimeout(() => {
      const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      setActivityData(generateRandomData(days));
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTimeRange(event.target.value);
  };

  // Функция для форматирования чисел с разделителями тысяч
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Расчет общих метрик за выбранный период
  const totalUploads = activityData.reduce((sum, item) => sum + (item.uploads || 0), 0);
  const totalCompressed = activityData.reduce((sum, item) => sum + (item.compressed || 0), 0);
  const totalViews = activityData.reduce((sum, item) => sum + (item.views || 0), 0);
  const totalDownloads = activityData.reduce((sum, item) => sum + (item.downloads || 0), 0);
  const totalSpaceUsed = activityData.reduce((sum, item) => sum + (item.spaceUsed || 0), 0);
  const totalSpaceSaved = activityData.reduce((sum, item) => sum + (item.spaceSaved || 0), 0);

  // Средняя эффективность сжатия
  const compressionEfficiency = totalSpaceSaved > 0 ? Math.round((totalSpaceSaved / (totalSpaceUsed + totalSpaceSaved)) * 100) : 0;

  // Генерируем данные для графика эффективности
  const efficiencyData = activityData.map(item => ({
    date: item.date,
    efficiency: (item.spaceSaved || 0) > 0 ? 
      Math.round(((item.spaceSaved || 0) / ((item.spaceUsed || 0) + (item.spaceSaved || 0))) * 100) : 0
  }));

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Метрики
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Аналитика и статистика по работе сервиса
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      ) : (
        <>
          {/* Период времени и элементы управления */}
          <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ButtonGroup variant="outlined" size="small">
                <Button 
                  variant={timeRange === 'day' ? 'contained' : 'outlined'} 
                  onClick={() => setTimeRange('day')}
                >
                  День
                </Button>
                <Button 
                  variant={timeRange === 'week' ? 'contained' : 'outlined'} 
                  onClick={() => setTimeRange('week')}
                >
                  Неделя
                </Button>
                <Button 
                  variant={timeRange === 'month' ? 'contained' : 'outlined'} 
                  onClick={() => setTimeRange('month')}
                >
                  Месяц
                </Button>
                <Button 
                  variant={timeRange === 'quarter' ? 'contained' : 'outlined'} 
                  onClick={() => setTimeRange('quarter')}
                >
                  Квартал
                </Button>
              </ButtonGroup>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Данные с {activityData[0]?.date || 'N/A'} по {activityData[activityData.length - 1]?.date || 'N/A'}
              </Typography>
              <Button variant="contained" size="small">
                Обновить данные
              </Button>
            </Box>
          </Paper>

          {/* Ряд карточек с ключевыми метриками */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid component="div" xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Всего загрузок
                </Typography>
                <Typography variant="h3" component="div">
                  {formatNumber(totalUploads)}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 1
                  }}
                >
                  <Typography
                    variant="body2"
                    color="success.main"
                  >
                    +{Math.round(totalUploads / activityData.length * 0.1)}%
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    по сравнению с предыдущим периодом
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid component="div" xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Всего просмотров
                </Typography>
                <Typography variant="h3" component="div">
                  {formatNumber(totalViews)}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 1
                  }}
                >
                  <Typography
                    variant="body2"
                    color="success.main"
                  >
                    +{Math.round(totalViews / activityData.length * 0.15)}%
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    по сравнению с предыдущим периодом
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid component="div" xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Всего скачиваний
                </Typography>
                <Typography variant="h3" component="div">
                  {formatNumber(totalDownloads)}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 1
                  }}
                >
                  <Typography
                    variant="body2"
                    color="success.main"
                  >
                    +{Math.round(totalDownloads / activityData.length * 0.08)}%
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    по сравнению с предыдущим периодом
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid component="div" xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Эффективность сжатия
                </Typography>
                <Typography variant="h3" component="div">
                  {compressionEfficiency}%
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 1
                  }}
                >
                  <Typography
                    variant="body2"
                    color={Math.random() > 0.5 ? 'success.main' : 'error.main'}
                  >
                    {Math.random() > 0.5 ? '+' : '-'}{Math.round(Math.random() * 5)}%
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    по сравнению с предыдущим периодом
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Графики */}
          <Box sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleChangeTab} aria-label="metrics tabs">
              <Tab label="Активность" />
              <Tab label="Эффективность" />
              <Tab label="Распределение" />
            </Tabs>

            <Paper sx={{ mt: 2 }}>
              <TabPanel value={tabValue} index={0}>
                <Typography variant="h6" gutterBottom>
                  Активность пользователей
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Количество загрузок, просмотров и скачиваний изображений за период
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={activityData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="uploads" name="Загрузки" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="views" name="Просмотры" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="downloads" name="Скачивания" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                  Эффективность сжатия
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Процент сокращения размера изображений и общая экономия места
                </Typography>
                <Box sx={{ height: 400, display: 'flex', flexWrap: 'wrap' }}>
                  <Box sx={{ width: '60%', height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={efficiencyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis unit="%" domain={[0, 100]} />
                        <Tooltip formatter={(value: number) => [`${value}%`, 'Эффективность']} />
                        <Legend />
                        <Line type="monotone" dataKey="efficiency" name="Эффективность сжатия" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ width: '40%', height: '100%', pl: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={activityData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="spaceUsed" name="Использовано (MB)" fill="#82ca9d" stackId="a" />
                        <Bar dataKey="spaceSaved" name="Сэкономлено (MB)" fill="#8884d8" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                  <Grid component="div" xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Типы изображений
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Распределение по форматам загруженных изображений
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={imageTypesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {imageTypesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value}%`, 'Доля']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  
                  <Grid component="div" xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Степень сжатия
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Распределение по степени сжатия изображений
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={compressionRateData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {compressionRateData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value}%`, 'Доля']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                </Grid>
              </TabPanel>
            </Paper>
          </Box>

          {/* Детальная статистика */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Детальная статистика хранилища
            </Typography>
            <Grid container spacing={3}>
              <Grid component="div" xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Всего места использовано
                  </Typography>
                  <Typography variant="h5">
                    {formatNumber(totalSpaceUsed)} MB
                  </Typography>
                </Box>
              </Grid>
              <Grid component="div" xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Всего места сэкономлено
                  </Typography>
                  <Typography variant="h5">
                    {formatNumber(totalSpaceSaved)} MB
                  </Typography>
                </Box>
              </Grid>
              <Grid component="div" xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Средний размер изображения
                  </Typography>
                  <Typography variant="h5">
                    {totalUploads > 0 ? formatNumber(Math.round(totalSpaceUsed / totalUploads)) : 0} KB
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default MetricsPage;
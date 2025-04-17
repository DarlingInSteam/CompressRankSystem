import axios from 'axios';

/**
 * Обновленная конфигурация API клиента для работы через API Gateway
 * 
 * API Gateway автоматически маршрутизирует запросы к соответствующим микросервисам
 */

// Создаем единый экземпляр axios с базовым URL для API Gateway
const apiClient = axios.create({
  // Используем единый порт API Gateway для всех сервисов
  baseURL: 'http://localhost:8082',
  headers: {
    'Content-Type': 'application/json'
  },
  // Включаем отправку куки при кросс-доменных запросах
  withCredentials: true
});

// Функция обработки ошибок - выносим в отдельную функцию для переиспользования
const errorHandler = (error: any) => {
  // Обработка ошибок аутентификации
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    // В случае истечения срока действия токена, перенаправляем на страницу входа
    if (error.response.status === 401) {
      console.warn('Authentication token expired or invalid');
      localStorage.removeItem('token');
      
      // Добавляем небольшую задержку, чтобы избежать конфликтов при редиректе
      setTimeout(() => {
        window.location.href = '/login?expired=true';
      }, 100);
    }
    
    // Если доступ запрещен, но токен действителен (403)
    if (error.response.status === 403) {
      console.error('Access denied to resource:', error.config?.url || 'unknown');
    }
  }
  
  // Более детальная обработка CORS ошибок
  if (error.message && error.message.includes('CORS')) {
    console.error('CORS Error detected:', error.message);
    console.warn('Для исправления CORS ошибки необходимо настроить API Gateway сервер:');
    console.warn('1. Убедитесь, что в API Gateway разрешены только одиночные значения для заголовка Access-Control-Allow-Origin');
    console.warn('2. Проверьте, что заголовок Access-Control-Allow-Origin имеет значение http://localhost:3000 (без дубликатов)');
    console.warn('3. Убедитесь, что в настройках CORS middleware нет повторного добавления заголовков');
  } else {
    console.error('API Error:', error);
  }
  
  if (error.response) {
    const status = error.response.status;
    const path = error.config?.url || 'unknown';
    
    if (status === 500) {
      console.error(`Серверная ошибка (${path}):`, error.response.data);
    } else if (status === 503) {
      console.error(`Сервис временно недоступен (${path}):`, error.response.data);
    }
  }
  
  return Promise.reject(error);
};

// Перехватчик запросов для добавления токена аутентификации
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчик ответов для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  errorHandler
);

// Создаем экземпляр для обработки multipart/form-data запросов (загрузка файлов)
const apiClientMultipart = axios.create({
  baseURL: 'http://localhost:8082',
  withCredentials: true
});

// Добавляем тот же перехватчик для multipart запросов
apiClientMultipart.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Используем тот же перехватчик ошибок, но без обращения к internal handlers
apiClientMultipart.interceptors.response.use(
  (response) => response,
  errorHandler
);

// Экспортируем оба клиента для обратной совместимости
// API Gateway теперь выполняет маршрутизацию между сервисами
const apiClientCompressionService = apiClient;

export { apiClient, apiClientCompressionService, apiClientMultipart };
export default apiClient;
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
  // Запрещаем автоматическую установку заголовков для CORS
  // т.к. они должны устанавливаться на стороне сервера
  withCredentials: false
});

// Функция обработки ошибок - выносим в отдельную функцию для переиспользования
const errorHandler = (error: any) => {
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
    } else if (status === 403) {
      console.error(`Ошибка доступа (${path}):`, error.response.data);
    } else if (status === 503) {
      console.error(`Сервис временно недоступен (${path}):`, error.response.data);
    }
  }
  
  return Promise.reject(error);
};

// Перехватчик ответов для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  errorHandler
);

// Создаем экземпляр для обработки multipart/form-data запросов (загрузка файлов)
const apiClientMultipart = axios.create({
  baseURL: 'http://localhost:8082',
  withCredentials: false
});

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
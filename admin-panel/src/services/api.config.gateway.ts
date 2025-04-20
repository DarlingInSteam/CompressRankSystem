import axios from 'axios';

/**
 * Обновленная конфигурация API клиента для работы через API Gateway
 * 
 * Этот файл предоставляет пример настройки API клиента для использования
 * единого API Gateway вместо прямого доступа к микросервисам.
 * 
 * Для использования переименуйте этот файл в api.config.ts или
 * скопируйте его содержимое в существующий api.config.ts
 */

// Создаем единый экземпляр axios с базовым URL для API Gateway
const apiClient = axios.create({
  // Используем единый порт API Gateway для всех сервисов
  baseURL: 'http://localhost:8082',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Перехватчик ответов для обработки ошибок
apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  console.error('API Error:', error);
  
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
});

// Экспортируем оба клиента для обратной совместимости
// API Gateway теперь выполняет маршрутизацию между сервисами
const apiClientCompressionService = apiClient;

export { apiClient, apiClientCompressionService };
export default apiClient;

/**
 * Примечание по использованию API Gateway:
 * 
 * 1. API Gateway автоматически маршрутизирует запросы на основе пути:
 *    - /api/images/** -> к сервису хранения изображений
 *    - /api/compression/** -> к сервису сжатия
 * 
 * 2. Все текущие вызовы API в приложении продолжат работать без изменений,
 *    так как пути остаются неизменными, меняется только базовый URL.
 * 
 * 3. Дополнительные возможности API Gateway:
 *    - Мониторинг состояния: GET /api/system/health
 *    - Информация о системе: GET /api/system/info
 *    - Документация API: GET /api/docs
 */
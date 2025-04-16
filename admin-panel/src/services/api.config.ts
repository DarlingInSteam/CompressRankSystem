import axios from 'axios';

// Создаем экземпляр axios с базовым URL
const apiClient = axios.create({
  // Используем правильный порт для API сервисов (порт storage service)
  baseURL: 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json'
  }
});

const apiClientCompressionService = axios.create({
  // Используем правильный порт для API сервисов (порт compression service)
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Перехватчик ответов для обработки ошибок
apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    const status = error.response.status;
    
    if (status === 500) {
      console.error('Серверная ошибка:', error.response.data);
    }
  }
  
  return Promise.reject(error);
});

// Перехватчик ответов для обработки ошибок для compression service
apiClientCompressionService.interceptors.response.use((response) => {
  return response;
}, (error) => {
  console.error('Compression API Error:', error);
  
  if (error.response) {
    const status = error.response.status;
    
    if (status === 500) {
      console.error('Серверная ошибка сервиса компрессии:', error.response.data);
    }
  }
  
  return Promise.reject(error);
});

export { apiClient, apiClientCompressionService };
export default apiClient;
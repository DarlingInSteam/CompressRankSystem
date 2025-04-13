import axios from 'axios';

// Создаем экземпляр axios с базовым URL
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api', // Обновлено: убран '/api' суффикс для соответствия CompressionService
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

export default apiClient;
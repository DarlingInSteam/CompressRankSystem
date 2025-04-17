-- Создаем отдельные БД для каждого микросервиса
CREATE DATABASE storage_db;
CREATE DATABASE compression_db;
CREATE DATABASE statistics_db;
CREATE DATABASE auth_db;

-- Даем привилегии для пользователя postgres на все базы
GRANT ALL PRIVILEGES ON DATABASE storage_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE compression_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE statistics_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
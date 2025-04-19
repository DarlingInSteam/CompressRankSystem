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

-- Add default image pagination settings to system settings
INSERT INTO system_settings (setting_key, setting_value, description, setting_group) 
VALUES ('images_per_page', '20', 'Number of images to display per page in the gallery', 'ui_settings')
ON CONFLICT (setting_key) DO NOTHING;

-- Add pagination size setting
INSERT INTO system_settings (setting_key, setting_value, setting_group, description)
VALUES ('admin_images_per_page', '20', 'ui_settings', 'Number of images to display per page on the admin panel');
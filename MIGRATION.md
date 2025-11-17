# 🚀 Миграция Storage Buddy Bot на Self-Hosted (Synology)

Это руководство поможет вам полностью перенести Storage Buddy Bot с Vercel и Supabase Cloud на ваш Synology NAS и ничего не платить за хостинг!

## 📋 Содержание

1. [Требования](#требования)
2. [Подготовка Synology](#подготовка-synology)
3. [Генерация ключей и настройка окружения](#генерация-ключей-и-настройка-окружения)
4. [Миграция базы данных](#миграция-базы-данных)
5. [Сборка и деплой приложения](#сборка-и-деплой-приложения)
6. [Запуск сервисов](#запуск-сервисов)
7. [Настройка доступа извне](#настройка-доступа-извне)
8. [Автоматические бэкапы](#автоматические-бэкапы)
9. [Обновление приложения](#обновление-приложения)
10. [Решение проблем](#решение-проблем)

---

## 🔧 Требования

### Synology NAS

- **Модель**: любая с поддержкой Docker (большинство моделей DS/RS)
- **DSM**: версия 7.0 или выше
- **RAM**: минимум 2GB, рекомендуется 4GB+
- **Место на диске**: минимум 10GB свободного места
- **CPU**: любой современный процессор

### Программное обеспечение

На Synology должно быть установлено:
- Docker (из Package Center)
- Container Manager (бывший Docker package в DSM 7.2+)
- Git Server (опционально, для удобства)

На вашем компьютере:
- Git
- SSH клиент
- Современный браузер

---

## 📦 Подготовка Synology

### Шаг 1: Установка Docker

1. Откройте **Package Center** на Synology
2. Найдите **Container Manager** (или **Docker** в старых версиях DSM)
3. Нажмите **Install**
4. Дождитесь завершения установки

### Шаг 2: Включение SSH

1. Откройте **Control Panel** → **Terminal & SNMP**
2. Включите **Enable SSH service**
3. Установите порт (по умолчанию 22)
4. Нажмите **Apply**

### Шаг 3: Подключение по SSH

Подключитесь к вашему Synology через SSH:

```bash
ssh admin@your-synology-ip
# Или используйте вашего пользователя
ssh your-username@your-synology-ip
```

### Шаг 4: Создание директории для проекта

```bash
# Переходим в домашнюю директорию
cd ~

# Создаем директорию для проекта
sudo mkdir -p /volume1/docker/storage-buddy
sudo chown -R $(whoami):users /volume1/docker/storage-buddy

# Переходим в директорию
cd /volume1/docker/storage-buddy
```

### Шаг 5: Клонирование проекта

```bash
# Клонируем репозиторий
git clone https://github.com/uggybe/storage-buddy-bot.git .

# Переключаемся на нужную ветку если требуется
git checkout main
```

---

## 🔐 Генерация ключей и настройка окружения

### Шаг 1: Генерация секретных ключей

Используем автоматический скрипт для генерации всех необходимых ключей:

```bash
cd /volume1/docker/storage-buddy
./scripts/generate-keys.sh
```

Скрипт автоматически создаст файл `.env.local` с:
- JWT секретами
- Supabase API ключами (ANON и SERVICE_ROLE)
- Паролем PostgreSQL
- Базовой конфигурацией

### Шаг 2: Настройка переменных окружения

Отредактируйте `.env.local`:

```bash
nano .env.local
# Или используйте vi, vim или любой другой редактор
```

**Обязательно обновите следующие значения:**

```bash
# Telegram Bot Token (получите от @BotFather)
TELEGRAM_BOT_TOKEN=1234567890:ваш_токен_от_BotFather

# IP адрес или домен вашего Synology
# Найдите ваш локальный IP: ip addr show или ifconfig
SUPABASE_PUBLIC_URL=http://192.168.1.100:8000  # замените на ваш IP
SITE_URL=http://192.168.1.100                   # замените на ваш IP
VITE_SUPABASE_URL=http://192.168.1.100:8000    # замените на ваш IP
VITE_TELEGRAM_API_URL=http://192.168.1.100/telegram

# Если планируете использовать email уведомления
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Создайте App Password в настройках Gmail
SMTP_ADMIN_EMAIL=admin@yourdomain.com
```

**Сохраните файл**: `Ctrl+O`, затем `Enter`, затем `Ctrl+X`

---

## 💾 Миграция базы данных

Если вы мигрируете с существующего Supabase проекта:

### Вариант 1: Экспорт из Supabase Cloud (рекомендуется)

#### Шаг 1: Установка Supabase CLI (на вашем компьютере)

```bash
npm install -g supabase
```

#### Шаг 2: Получение пароля БД из Supabase

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **Settings** → **Database**
4. Найдите **Connection string** и скопируйте пароль

#### Шаг 3: Экспорт данных

На вашем компьютере:

```bash
cd path/to/storage-buddy-bot

# Экспорт схемы
supabase db dump \
  --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" \
  --schema public \
  > backup-schema.sql

# Экспорт данных
supabase db dump \
  --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" \
  --data-only \
  --schema public \
  > backup-data.sql
```

#### Шаг 4: Копирование бэкапа на Synology

```bash
# С вашего компьютера
scp backup-*.sql admin@your-synology-ip:/volume1/docker/storage-buddy/
```

### Вариант 2: Чистая установка (для новых проектов)

Если вы начинаете с нуля, просто используйте миграции из директории `supabase/migrations` - они будут применены автоматически при первом запуске.

---

## 🏗️ Сборка и деплой приложения

### Шаг 1: Сборка фронтенда

На Synology или на вашем компьютере:

```bash
cd /volume1/docker/storage-buddy

# Установка зависимостей
npm install

# Создание .env файла для сборки
cp .env.local .env

# Сборка приложения
npm run build
```

Если собираете на компьютере, скопируйте папку `dist` на Synology:

```bash
scp -r dist admin@your-synology-ip:/volume1/docker/storage-buddy/
```

### Шаг 2: Сборка Telegram сервиса

```bash
cd /volume1/docker/storage-buddy/telegram-service

# Установка зависимостей
npm install --production
```

---

## 🚀 Запуск сервисов

### Шаг 1: Запуск PostgreSQL и применение миграций

```bash
cd /volume1/docker/storage-buddy

# Запуск только PostgreSQL сначала
docker-compose up -d postgres

# Ждем пока PostgreSQL полностью запустится
sleep 10

# Проверяем статус
docker-compose ps

# Применяем миграции (если мигрируете существующие данные)
docker exec -i storage-buddy-postgres psql -U postgres -d postgres < backup-schema.sql
docker exec -i storage-buddy-postgres psql -U postgres -d postgres < backup-data.sql
```

### Шаг 2: Запуск всех сервисов

```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

Вы должны увидеть:
- ✅ `storage-buddy-postgres` - База данных
- ✅ `storage-buddy-kong` - API Gateway
- ✅ `storage-buddy-auth` - Аутентификация
- ✅ `storage-buddy-rest` - REST API
- ✅ `storage-buddy-realtime` - WebSocket
- ✅ `storage-buddy-storage` - Файловое хранилище
- ✅ `storage-buddy-studio` - Supabase Studio UI
- ✅ `storage-buddy-frontend` - Веб-приложение
- ✅ `storage-buddy-telegram` - Telegram API сервис

### Шаг 3: Проверка работоспособности

Откройте в браузере:

```
# Основное приложение
http://your-synology-ip

# Supabase Studio (админ панель)
http://your-synology-ip:3000

# Health check API
http://your-synology-ip/health
http://your-synology-ip/telegram/health
```

---

## 🌍 Настройка доступа извне

Чтобы получить доступ к приложению из интернета:

### Вариант 1: Использование Synology DDNS

1. Откройте **Control Panel** → **External Access** → **DDNS**
2. Нажмите **Add**
3. Выберите **Synology** как провайдера
4. Введите желаемое имя поддомена (например, `storage-buddy.synology.me`)
5. Нажмите **OK**

### Вариант 2: Использование собственного домена

1. Зарегистрируйте домен (например, на Cloudflare, Namecheap)
2. Настройте A-запись, указывающую на внешний IP вашего роутера
3. Настройте Port Forwarding на роутере:
   - Внешний порт 80 → Synology IP:80
   - Внешний порт 443 → Synology IP:443

### Настройка SSL/TLS (HTTPS)

#### Через Synology DSM

1. **Control Panel** → **Security** → **Certificate**
2. Нажмите **Add** → **Add a new certificate**
3. Выберите **Get a certificate from Let's Encrypt**
4. Введите ваш домен
5. Примените сертификат к приложению

#### Обновление конфигурации Nginx

После получения сертификата, обновите `nginx.conf`:

```bash
nano /volume1/docker/storage-buddy/nginx.conf
```

Раскомментируйте строки SSL:

```nginx
listen 443 ssl http2;
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

Скопируйте сертификаты:

```bash
# Создаем директорию
mkdir -p /volume1/docker/storage-buddy/volumes/ssl

# Копируем сертификаты из DSM
sudo cp /usr/syno/etc/certificate/_archive/[YOUR-CERT-ID]/cert.pem /volume1/docker/storage-buddy/volumes/ssl/
sudo cp /usr/syno/etc/certificate/_archive/[YOUR-CERT-ID]/privkey.pem /volume1/docker/storage-buddy/volumes/ssl/key.pem
```

Перезапустите Nginx:

```bash
docker-compose restart frontend
```

Обновите `.env.local`:

```bash
SUPABASE_PUBLIC_URL=https://yourdomain.com:8000
SITE_URL=https://yourdomain.com
VITE_SUPABASE_URL=https://yourdomain.com:8000
```

---

## 🔄 Автоматические бэкапы

### Настройка автоматических бэкапов

#### Шаг 1: Тестирование скрипта бэкапа

```bash
cd /volume1/docker/storage-buddy
./scripts/backup-local.sh
```

Проверьте, что бэкап создался в `./backups/local/`

#### Шаг 2: Настройка Cron задачи

```bash
# Открываем crontab
crontab -e
```

Добавьте следующие строки:

```bash
# Ежедневный бэкап в 3:00 ночи
0 3 * * * cd /volume1/docker/storage-buddy && ./scripts/backup-local.sh >> /volume1/docker/storage-buddy/logs/backup.log 2>&1

# Еженедельная очистка старых логов (оставляем последние 30 дней)
0 4 * * 0 find /volume1/docker/storage-buddy/logs -name "*.log" -mtime +30 -delete
```

Сохраните и выйдите.

#### Шаг 3: Копирование бэкапов на внешнее хранилище (опционально)

Отредактируйте `scripts/backup-local.sh` и раскомментируйте строки в конце:

```bash
# Копируем на внешний диск Synology
rsync -avz "$BACKUP_DIR" /volumeUSB1/usbshare/storage-buddy-backups/

# Или на другой сервер
# rsync -avz "$BACKUP_DIR" user@remote-server:/path/to/backups/
```

---

## 🔄 Обновление приложения

Когда выходят обновления:

```bash
cd /volume1/docker/storage-buddy

# Сохраняем изменения (если есть)
git stash

# Получаем последние изменения
git pull origin main

# Восстанавливаем наши изменения
git stash pop

# Обновляем зависимости
npm install
cd telegram-service && npm install && cd ..

# Пересобираем фронтенд
npm run build

# Перезапускаем сервисы
docker-compose down
docker-compose up -d

# Проверяем логи
docker-compose logs -f
```

---

## 🐛 Решение проблем

### База данных не запускается

```bash
# Проверка логов
docker-compose logs postgres

# Проверка прав доступа
ls -la volumes/db/data/

# Очистка и перезапуск (ВНИМАНИЕ: удалит все данные!)
docker-compose down -v
rm -rf volumes/db/data/*
docker-compose up -d postgres
```

### Не работает аутентификация

```bash
# Проверьте JWT ключи
docker-compose exec auth env | grep JWT_SECRET

# Убедитесь что ключи одинаковые во всех сервисах
docker-compose config | grep JWT_SECRET

# Перегенерируйте ключи
./scripts/generate-keys.sh
docker-compose down
docker-compose up -d
```

### Ошибки CORS

Проверьте, что в `.env.local` правильно указаны URL:

```bash
# URL должны совпадать с реальными адресами
SUPABASE_PUBLIC_URL=http://your-actual-ip:8000
VITE_SUPABASE_URL=http://your-actual-ip:8000
```

### Telegram бот не отправляет файлы

```bash
# Проверка Telegram сервиса
docker-compose logs telegram-api

# Проверка токена
docker-compose exec telegram-api env | grep TELEGRAM_BOT_TOKEN

# Тест эндпоинта
curl -X POST http://localhost:3001/health
```

### Просмотр всех логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f postgres
docker-compose logs -f frontend
docker-compose logs -f telegram-api
```

### Полная переустановка

```bash
# ВНИМАНИЕ: удалит ВСЕ данные!
docker-compose down -v
rm -rf volumes/
docker-compose up -d
```

---

## 📊 Мониторинг и статистика

### Использование ресурсов

```bash
# CPU и память всех контейнеров
docker stats

# Размер баз данных
docker-compose exec postgres psql -U postgres -d postgres -c "
SELECT
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;
"

# Место на диске
du -sh volumes/
```

### Подключение к базе данных

```bash
# Через Docker
docker-compose exec postgres psql -U postgres -d postgres

# Через внешнее подключение (для GUI инструментов типа DBeaver)
# Host: your-synology-ip
# Port: 5432
# Database: postgres
# Username: postgres
# Password: (из .env.local)
```

---

## 🎉 Готово!

Теперь у вас полностью self-hosted Storage Buddy Bot на вашем Synology!

### Что дальше?

- ✅ Настройте автоматические бэкапы
- ✅ Настройте HTTPS для безопасности
- ✅ Добавьте мониторинг (Grafana + Prometheus)
- ✅ Настройте firewall правила
- ✅ Создайте документацию для вашей команды

### Полезные ссылки

- [Supabase Self-Hosting Docs](https://supabase.com/docs/guides/self-hosting)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Synology Docker Guide](https://www.synology.com/en-global/dsm/packages/Docker)

---

**Вопросы?** Создайте issue в репозитории!

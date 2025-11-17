# Решение проблемы: PostgreSQL is unhealthy

## Симптом
```
dependence failed to start: container storage-buddy-postgres is unhealthy
```

## Шаг 1: Проверьте логи PostgreSQL

Откройте Command Prompt и выполните:

```cmd
cd C:\путь\к\storage-buddy-bot
docker compose logs postgres
```

Найдите в логах строки с ошибками (ERROR, FATAL, panic).

---

## Наиболее частые проблемы и решения

### Проблема 1: Порт 5432 уже занят

**Симптом в логах:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use
```

**Решение:**

1. Проверьте занятые порты:
   ```cmd
   netstat -ano | findstr :5432
   ```

2. Если порт занят, остановите процесс или измените порт в `docker-compose.yml`:
   ```yaml
   postgres:
     ports:
       - "5433:5432"  # Измените 5432 на 5433
   ```

### Проблема 2: Проблемы с правами доступа к volumes

**Симптом в логах:**
```
chmod: changing permissions of '/var/lib/postgresql/data': Operation not permitted
initdb: could not change permissions
```

**Решение:**

1. Полностью удалите volumes:
   ```cmd
   docker compose down -v
   ```

2. Удалите папку вручную (если есть):
   ```cmd
   rmdir /s volumes\postgres
   ```

3. Запустите заново:
   ```cmd
   docker compose up -d
   ```

### Проблема 3: Поврежденные данные в volume

**Симптом в логах:**
```
FATAL: database files are incompatible with server
DETAIL: The data directory was initialized by PostgreSQL version X
```

**Решение:**

```cmd
docker compose down -v
docker compose up -d
```

Флаг `-v` удалит все volumes и создаст чистую базу данных.

### Проблема 4: Ошибка в init скрипте

**Симптом в логах:**
```
ERROR: syntax error at or near "..."
/docker-entrypoint-initdb.d/00000000000000_init_roles.sql:XX
```

**Решение:**

Проверьте что файл `supabase/migrations/00000000000000_init_roles.sql` существует и не поврежден.

Перезапустите с чистой базой:
```cmd
docker compose down -v
docker compose up -d
```

### Проблема 5: Недостаточно памяти

**Симптом в логах:**
```
could not resize shared memory segment
FATAL: could not create shared memory segment
```

**Решение:**

В Docker Desktop:
1. Откройте Settings → Resources
2. Увеличьте Memory до минимум 4GB
3. Примените изменения
4. Перезапустите Docker Desktop

---

## Шаг 2: Проверьте статус контейнера

```cmd
docker compose ps
```

Должно быть:
```
storage-buddy-postgres   Up X seconds (healthy)
```

Если видите "(starting)" - подождите 30-60 секунд и проверьте снова.

---

## Шаг 3: Проверьте healthcheck

```cmd
docker inspect storage-buddy-postgres --format='{{json .State.Health}}'
```

Это покажет детали проверки здоровья контейнера.

---

## Шаг 4: Подключитесь к PostgreSQL напрямую

Попробуйте подключиться вручную:

```cmd
docker exec -it storage-buddy-postgres psql -U postgres -d postgres
```

Если подключение успешно, выполните:
```sql
\du
```

Вы должны увидеть все роли:
- postgres
- authenticator
- anon
- authenticated
- service_role
- supabase_auth_admin
- supabase_storage_admin
- supabase_admin

Выход из psql: `\q`

---

## Шаг 5: Полный сброс (если ничего не помогло)

**ВНИМАНИЕ: Это удалит все данные!**

```cmd
docker compose down -v
docker volume prune -f
docker compose up -d
```

Затем следите за логами:
```cmd
docker compose logs -f postgres
```

Вы должны увидеть:
```
PostgreSQL init process complete; ready for start up.
database system is ready to accept connections
```

---

## Проверка успешного запуска

После исправления проблемы проверьте:

```cmd
docker compose ps
```

Все сервисы должны быть "Up":
- storage-buddy-postgres (healthy)
- storage-buddy-kong
- storage-buddy-auth
- storage-buddy-rest
- storage-buddy-storage
- storage-buddy-realtime
- storage-buddy-frontend
- storage-buddy-telegram
- storage-buddy-imgproxy

---

## Что делать дальше

1. **Отправьте мне вывод команды:**
   ```cmd
   docker compose logs postgres
   ```
   Пришлите последние 50-100 строк, чтобы я мог увидеть конкретную ошибку.

2. **Проверьте версию Docker:**
   ```cmd
   docker --version
   docker compose version
   ```
   Минимум: Docker 20.10+, Docker Compose 2.0+

3. **Проверьте системные ресурсы:**
   - Минимум 4GB RAM для Docker Desktop
   - Минимум 10GB свободного места на диске

---

## Быстрая диагностика

Выполните все команды подряд и пришлите мне результат:

```cmd
docker compose ps
docker compose logs postgres --tail 20
docker stats --no-stream storage-buddy-postgres
```

Это даст полную картину проблемы!

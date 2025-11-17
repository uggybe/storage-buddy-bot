# Storage Buddy Bot - Quick Start Guide (Windows 10)

## Prerequisites Check
- [x] Docker Desktop installed and running
- [x] Node.js 20 installed
- [x] Git installed

## Step 1: Configure Environment

Your `.env` file is already configured with default values. You only need to:

1. **Add your Telegram Bot Token**:
   - Open `.env` in a text editor
   - Replace `YOUR_TELEGRAM_BOT_TOKEN_HERE` with your actual token from @BotFather
   - Save the file

## Step 2: Start All Services

Open Command Prompt (cmd) and run:

```cmd
cd C:\path\to\storage-buddy-bot
docker compose down -v
docker compose up -d
```

**Note**: The `-v` flag removes old volumes to ensure fresh database initialization.

## Step 3: Wait for Services to Start

Check status (wait ~30-60 seconds):

```cmd
docker compose ps
```

All services should show status "Up" or "Up (healthy)":
- storage-buddy-postgres (should be healthy)
- storage-buddy-kong
- storage-buddy-auth
- storage-buddy-rest
- storage-buddy-storage
- storage-buddy-realtime
- storage-buddy-frontend
- storage-buddy-telegram
- storage-buddy-imgproxy

## Step 4: Check Logs (if any service fails)

View logs for a specific service:

```cmd
docker compose logs postgres
docker compose logs auth
docker compose logs kong
```

View all logs:

```cmd
docker compose logs
```

## Step 5: Access the Application

Open your browser and go to:
- **Frontend**: http://localhost
- **API Gateway**: http://localhost:8000
- **Telegram Service**: http://localhost:3001/health

## Step 6: Create Your First User

1. Go to http://localhost
2. Click "Sign Up"
3. Enter email and password
4. You'll be automatically logged in (autoconfirm is enabled)

## Troubleshooting

### Services Keep Restarting

Check if PostgreSQL initialized properly:

```cmd
docker compose logs postgres | findstr "roles"
```

You should see messages about creating roles (authenticator, anon, authenticated, etc.)

### Can't Access Frontend

Check if nginx is running:

```cmd
docker compose logs frontend
```

### Telegram Bot Not Working

1. Make sure you added your bot token to `.env`
2. Restart the service:

```cmd
docker compose restart telegram-api
```

### Database Connection Errors

Make sure `POSTGRES_PASSWORD=postgres` in your `.env` file matches the password in the init script.

## Useful Commands

**Stop all services:**
```cmd
docker compose down
```

**Stop and remove volumes (fresh start):**
```cmd
docker compose down -v
```

**View real-time logs:**
```cmd
docker compose logs -f
```

**Restart a specific service:**
```cmd
docker compose restart auth
```

**Check service health:**
```cmd
docker compose ps
```

## What's Running

Your self-hosted setup includes:

1. **PostgreSQL** - Database (port 5432)
2. **Kong** - API Gateway (ports 8000, 8443)
3. **GoTrue (auth)** - Authentication service
4. **PostgREST (rest)** - REST API
5. **Realtime** - WebSocket server
6. **Storage API** - File storage
7. **ImgProxy** - Image optimization
8. **Nginx (frontend)** - Web server (port 80, 443)
9. **Telegram API** - Telegram bot service (port 3001)

All services run locally - no data goes to the cloud!

## Next Steps

- [ ] Set up HTTPS (see MIGRATION.md)
- [ ] Configure automated backups (see scripts/backup-local.sh)
- [ ] Export data from cloud Supabase (see MIGRATION.md)
- [ ] Configure external access (optional)

## Need Help?

Check the detailed guides:
- `MIGRATION.md` - Full migration guide
- `SELFHOSTED.md` - Self-hosting documentation
- `README.md` - Project overview

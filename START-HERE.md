# 🚀 START HERE - Storage Buddy Bot Self-Hosted Setup

## ✅ What's Been Done

All critical configuration files have been fixed and are ready to use:

1. **PostgreSQL initialization script fixed** - Database users will be created correctly
2. **Complete `.env` file created** - All required environment variables are configured
3. **Kong configuration cleaned** - Removed unused services
4. **Docker Compose optimized** - All services properly configured
5. **Documentation created** - Step-by-step guides for Windows 10

## 🎯 What You Need to Do (2 Steps)

### Step 1: Add Your Telegram Bot Token

1. Open `.env` file in a text editor (Notepad, VS Code, etc.)
2. Find this line:
   ```
   TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
   ```
3. Replace `YOUR_TELEGRAM_BOT_TOKEN_HERE` with your actual token from @BotFather
4. Save the file

### Step 2: Start Docker Services

Open Command Prompt (cmd) and run:

```cmd
cd C:\Users\YourUsername\path\to\storage-buddy-bot
docker compose down -v
docker compose up -d
```

**Wait 1-2 minutes**, then check status:

```cmd
docker compose ps
```

All services should show "Up" or "Up (healthy)".

## 🌐 Access Your Application

Once all services are running:

- **Frontend**: http://localhost
- **API**: http://localhost:8000
- **Telegram Service**: http://localhost:3001/health

## 📚 Need More Details?

Read these guides in order:

1. **QUICKSTART-WINDOWS.md** - Simple step-by-step guide for Windows 10
2. **FIXES-APPLIED.md** - Detailed explanation of what was fixed
3. **MIGRATION.md** - Complete migration guide from cloud to self-hosted

## 🔧 Troubleshooting

### Services Keep Restarting?

Check PostgreSQL logs:
```cmd
docker compose logs postgres
```

Look for "CREATE ROLE" messages - you should see 7 roles created.

### Can't Access http://localhost?

1. Check if frontend is running:
   ```cmd
   docker compose logs frontend
   ```

2. Make sure port 80 is not used by another application:
   ```cmd
   netstat -ano | findstr :80
   ```

### Need to See All Logs?

```cmd
docker compose logs -f
```

Press Ctrl+C to stop viewing logs.

## 💡 What's Different from Cloud?

| Cloud (Vercel + Supabase) | Self-Hosted (Your PC) |
|----------------------------|----------------------|
| Monthly bills | FREE |
| Data in the cloud | All data on your PC |
| Limited storage | Your disk space |
| Managed updates | You control updates |
| Internet required | Works offline* |

*Telegram features require internet connection

## 🎉 Next Steps After Setup

Once everything is running:

1. **Create your first user** - Go to http://localhost and sign up
2. **Test Telegram bot** - Send a message to your bot
3. **Upload test files** - Verify storage works
4. **Set up backups** - See `scripts/backup-local.sh`
5. **Configure HTTPS** (optional) - See MIGRATION.md

## ⚠️ Important Notes

- **Password**: All PostgreSQL users use password `postgres` (change in production!)
- **JWT Secret**: Default secret is set (change for production!)
- **SMTP**: Email autoconfirm is enabled, so SMTP is optional
- **Data persistence**: All data stored in `volumes/storage/` and `postgres-data` volume

## 🔐 Security for Production

If you want to make this production-ready:

1. Generate strong passwords (see `scripts/generate-keys.sh`)
2. Set up HTTPS with SSL certificates
3. Configure firewall rules
4. Enable SMTP for email notifications
5. Set up automated backups

See MIGRATION.md for detailed security setup.

## ❓ Questions?

- **What is Supabase?** - Open-source Firebase alternative (auth, database, storage)
- **Why self-host?** - No monthly bills, full control, data privacy
- **Is it production-ready?** - Yes, but change default passwords first!
- **Can I access it from other devices?** - Yes, replace `localhost` with your PC's IP address in `.env`

## 📦 What's Running

Your PC is now running these services:

- PostgreSQL 15 (Database)
- Kong 2.8 (API Gateway)
- GoTrue (Authentication)
- PostgREST (REST API)
- Realtime (WebSockets)
- Storage API (File storage)
- ImgProxy (Image optimization)
- Nginx (Web server)
- Custom Telegram API service

All running locally in Docker containers!

## 🎊 You're Ready!

Follow the 2 steps above and you'll have a fully self-hosted Storage Buddy Bot running on your Windows 10 machine in minutes!

**No more cloud bills. Your data, your hardware, your control.** 🔥

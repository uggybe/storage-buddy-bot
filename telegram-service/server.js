import express from 'express';
import cors from 'cors';
import FormData from 'form-data';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'telegram-api',
    timestamp: new Date().toISOString()
  });
});

// Send file to Telegram
app.post('/send-file', async (req, res) => {
  try {
    const { chatId, csvData, fileName } = req.body;

    // Валидация входных данных
    if (!chatId || !csvData || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: chatId, csvData, or fileName'
      });
    }

    console.log(`📤 Sending file "${fileName}" to chat ${chatId}`);

    // Создаем FormData для Telegram API
    const formData = new FormData();
    formData.append('chat_id', chatId.toString());

    // Конвертируем CSV данные в Buffer
    const buffer = Buffer.from(csvData, 'utf-8');
    formData.append('document', buffer, {
      filename: fileName,
      contentType: 'text/csv;charset=utf-8'
    });

    formData.append('caption', '📊 Журнал событий');

    // Отправляем файл в Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
      {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      }
    );

    const result = await telegramResponse.json();

    if (!result.ok) {
      console.error('❌ Telegram API error:', result);
      return res.status(500).json({
        success: false,
        error: `Telegram API error: ${result.description || 'Unknown error'}`
      });
    }

    console.log('✅ File sent successfully');

    res.json({
      success: true,
      message: 'File sent successfully',
      telegramResult: result
    });

  } catch (error) {
    console.error('❌ Error sending file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send message to Telegram
app.post('/send-message', async (req, res) => {
  try {
    const { chatId, text, parseMode = 'HTML' } = req.body;

    if (!chatId || !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: chatId or text'
      });
    }

    console.log(`📤 Sending message to chat ${chatId}`);

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: parseMode
        })
      }
    );

    const result = await telegramResponse.json();

    if (!result.ok) {
      console.error('❌ Telegram API error:', result);
      return res.status(500).json({
        success: false,
        error: `Telegram API error: ${result.description || 'Unknown error'}`
      });
    }

    console.log('✅ Message sent successfully');

    res.json({
      success: true,
      message: 'Message sent successfully',
      telegramResult: result
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Telegram API service running on port ${PORT}`);
  console.log(`📱 Bot token configured: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

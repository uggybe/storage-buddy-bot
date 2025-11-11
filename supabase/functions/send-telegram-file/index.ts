import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || "8139201002:AAGbwoT9GVX5eMQMkxfd4Uu_ZW4mRCOhmTI"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { chatId, csvData, fileName } = await req.json()

    if (!chatId || !csvData || !fileName) {
      throw new Error('Missing required parameters')
    }

    // Create form data for Telegram API
    const formData = new FormData()
    formData.append('chat_id', chatId.toString())

    // Convert CSV string to Blob
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    formData.append('document', blob, fileName)
    formData.append('caption', '📊 Журнал событий')

    // Send file to Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const result = await telegramResponse.json()

    if (!result.ok) {
      throw new Error(`Telegram API error: ${JSON.stringify(result)}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'File sent successfully' }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

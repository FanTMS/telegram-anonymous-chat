// Функция для настройки вебхука Telegram бота
export const handler = async (event, context) => {
  // Проверяем авторизацию
  const authHeader = event.headers.authorization
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized' })
    }
  }

  try {
    // Получаем токен бота из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '7253107901:AAGGqADN1itaEmd5BJTsUMf8THKLDkFhE4A'
    if (!botToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Bot token not configured' })
      }
    }

    // Формируем URL для вебхука
    const baseUrl = process.env.URL || event.headers.host
    const webhookUrl = `https://${baseUrl}/.netlify/functions/telegram-webhook`

    // Настраиваем вебхук
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true
      })
    })

    const data = await response.json()
    if (!data.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Failed to set webhook', data })
      }
    }

    // Получаем информацию о боте
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    const botInfo = await botInfoResponse.json()

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Webhook setup successful',
        webhookUrl,
        botInfo: botInfo.ok ? botInfo.result : null
      })
    }
  } catch (error) {
    console.error('Error setting up webhook:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    }
  }
}

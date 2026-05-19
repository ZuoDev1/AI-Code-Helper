import axios from 'axios'

const API_BASE_URL = 'http://localhost:8081/api'
const END_MARKER = '[DONE]'

function sanitizeChunk(data) {
  if (!data) {
    return ''
  }

  const trimmed = data.trim()
  if (!trimmed || trimmed === END_MARKER) {
    return ''
  }

  const lower = trimmed.toLowerCase()
  const looksLikeToolPayload =
    lower.includes('<tool') ||
    lower.includes('</tool') ||
    lower.includes('"tooltype"') ||
    lower.includes('"function"') ||
    lower.includes('"arguments"') ||
    lower.includes('"version"')

  return looksLikeToolPayload ? '' : data
}

export function chatWithSSE(memoryId, message, onMessage, onError, onClose) {
  const params = new URLSearchParams({
    memoryId,
    message
  })

  const eventSource = new EventSource(`${API_BASE_URL}/ai/chat?${params}`)
  let closedByApp = false

  eventSource.onmessage = function (event) {
    try {
      const data = sanitizeChunk(event.data)
      if (data) {
        onMessage(data)
      }
    } catch (error) {
      console.error('Failed to parse SSE message:', error)
      onError && onError(error)
    }
  }

  eventSource.addEventListener('end', function () {
    closedByApp = true
    eventSource.close()
    onClose && onClose()
  })

  eventSource.onerror = function (error) {
    if (closedByApp || eventSource.readyState === EventSource.CLOSED) {
      return
    }

    console.error('SSE connection error:', error)
    eventSource.close()
    onError && onError(error)
  }

  return eventSource
}

export async function checkServiceHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000
    })
    return response.status === 200
  } catch (error) {
    console.error('Health check failed:', error)
    return false
  }
}

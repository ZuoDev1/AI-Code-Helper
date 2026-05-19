<template>
  <div class="app">
    <div class="bg-orb orb-cyan"></div>
    <div class="bg-orb orb-pink"></div>
    <div class="bg-grid"></div>

    <div class="app-shell">
      <div class="app-header">
        <div class="brand">
          <div class="brand-logo-shell">
            <img :src="aiLogo" alt="AI 编程面试小助手" class="brand-logo" />
          </div>
          <div class="brand-copy">
            <h1 class="app-title">AI 编程面试小助手</h1>
            <div class="app-subtitle">面向编程学习与求职问答的智能协作界面</div>
          </div>
        </div>
      </div>

      <div class="chat-container">
        <div class="messages-container" ref="messagesContainer">
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="welcome-panel">
              <div class="welcome-badge">Neural Assist</div>
              <h2>欢迎进入智能问答工作台</h2>
              <p>这里适合提问代码问题、面试题、学习路线、报错排查和 SQL 练习。</p>
              <ul>
                <li>支持 Markdown 渲染与代码展示</li>
                <li>适合技术问答、题目生成与思路分析</li>
                <li>实时流式输出，适配长内容阅读</li>
              </ul>
            </div>
          </div>

          <ChatMessage
            v-for="message in messages"
            :key="message.id"
            :message="message.content"
            :is-user="message.isUser"
            :timestamp="message.timestamp"
          />

          <div v-if="isAiTyping" class="chat-message ai-message">
            <div class="message-avatar">
              <div class="avatar-shell">
                <img :src="aiLogo" alt="AI 头像" class="avatar-image" />
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <div class="ai-typing-content">
                  <div class="ai-response-text message-markdown" v-html="currentAiResponseRendered"></div>
                  <LoadingDots v-if="isStreaming" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <ChatInput
          :disabled="isAiTyping"
          @send-message="sendMessage"
          placeholder="输入你的技术问题、面试题或报错信息..."
        />
      </div>

      <div v-if="connectionError" class="connection-error">
        <div class="error-content">
          <span class="error-icon">!</span>
          <span>连接服务失败，请检查后端服务是否正常。</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ChatMessage from './components/ChatMessage.vue'
import ChatInput from './components/ChatInput.vue'
import LoadingDots from './components/LoadingDots.vue'
import { chatWithSSE } from './api/chatApi.js'
import { generateMemoryId } from './utils/index.js'
import { marked } from 'marked'

const aiLogo = new URL('../ai-logo.jpg', import.meta.url).href

function normalizeMarkdown(content) {
  if (!content) return ''

  return content
    .replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
    .replace(/^(\d+)\.([^\s])/gm, '$1. $2')
    .replace(/^([-*+])([^\s])/gm, '$1 $2')
}

marked.setOptions({
  breaks: true,
  gfm: true
})

export default {
  name: 'App',
  components: {
    ChatMessage,
    ChatInput,
    LoadingDots
  },
  data() {
    return {
      aiLogo,
      messages: [],
      memoryId: null,
      isAiTyping: false,
      isStreaming: false,
      currentAiResponse: '',
      currentEventSource: null,
      connectionError: false
    }
  },
  computed: {
    currentAiResponseRendered() {
      if (!this.currentAiResponse) return ''
      return marked(normalizeMarkdown(this.currentAiResponse))
    }
  },
  methods: {
    sendMessage(message) {
      this.addMessage(message, true)
      this.startAiResponse(message)
    },

    addMessage(content, isUser = false) {
      const message = {
        id: Date.now() + Math.random(),
        content,
        isUser,
        timestamp: new Date()
      }
      this.messages.push(message)
      this.scrollToBottom()
    },

    startAiResponse(userMessage) {
      this.isAiTyping = true
      this.isStreaming = true
      this.currentAiResponse = ''
      this.connectionError = false

      if (this.currentEventSource) {
        this.currentEventSource.close()
      }

      this.currentEventSource = chatWithSSE(
        this.memoryId,
        userMessage,
        this.handleAiMessage,
        this.handleAiError,
        this.handleAiClose
      )
    },

    handleAiMessage(data) {
      const incoming = (data || '').trim()
      if (!incoming) {
        return
      }

      const current = this.currentAiResponse.trim()

      if (!current) {
        this.currentAiResponse = data
      } else if (incoming === current || incoming.startsWith(current)) {
        this.currentAiResponse = data
      } else if (current.startsWith(incoming)) {
        return
      } else {
        this.currentAiResponse += data
      }

      this.scrollToBottom()
    },

    handleAiError(error) {
      console.error('AI 回复出错:', error)
      this.connectionError = true
      this.finishAiResponse()

      setTimeout(() => {
        this.connectionError = false
      }, 5000)
    },

    handleAiClose() {
      this.finishAiResponse()
    },

    finishAiResponse() {
      this.isStreaming = false

      if (this.currentAiResponse.trim()) {
        this.addMessage(this.currentAiResponse.trim(), false)
      }

      this.isAiTyping = false
      this.currentAiResponse = ''
      this.connectionError = false

      if (this.currentEventSource) {
        this.currentEventSource.close()
        this.currentEventSource = null
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },

    initializeChat() {
      this.memoryId = generateMemoryId()
      console.log('聊天记忆 ID:', this.memoryId)
    }
  },

  mounted() {
    this.initializeChat()
  },

  beforeUnmount() {
    if (this.currentEventSource) {
      this.currentEventSource.close()
    }
  }
}
</script>

<style scoped>
.app {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(124, 242, 255, 0.34), transparent 28%),
    radial-gradient(circle at 88% 18%, rgba(255, 162, 208, 0.24), transparent 24%),
    linear-gradient(135deg, #e7fbff 0%, #edf7fb 38%, #f4fbff 62%, #fef5fb 100%);
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(12px);
  pointer-events: none;
}

.orb-cyan {
  width: 420px;
  height: 420px;
  top: -80px;
  left: -100px;
  background: radial-gradient(circle, rgba(80, 235, 255, 0.36), rgba(80, 235, 255, 0));
}

.orb-pink {
  width: 360px;
  height: 360px;
  right: -70px;
  bottom: 80px;
  background: radial-gradient(circle, rgba(255, 150, 206, 0.24), rgba(255, 150, 206, 0));
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(84, 180, 210, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(84, 180, 210, 0.08) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.34), transparent 75%);
  pointer-events: none;
}

.app-shell {
  position: relative;
  z-index: 1;
  height: 100vh;
  padding: 18px;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 18px 24px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(198, 246, 255, 0.24));
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: 0 22px 48px rgba(38, 81, 103, 0.12);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand-logo-shell {
  width: 58px;
  height: 58px;
  padding: 4px;
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(113, 234, 255, 0.24));
  box-shadow: 0 12px 28px rgba(27, 72, 95, 0.14);
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  display: block;
}

.brand-copy {
  min-width: 0;
}

.app-title {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #1c3241;
}

.app-subtitle {
  margin-top: 6px;
  font-size: 14px;
  color: rgba(40, 73, 91, 0.74);
}

.chat-container {
  flex: 1;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 32px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.46), rgba(229, 249, 255, 0.22));
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: 0 26px 60px rgba(24, 63, 86, 0.12);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 26px 0 10px;
}

.welcome-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 0 24px;
}

.welcome-panel {
  width: min(100%, 620px);
  padding: 30px 32px;
  border-radius: 30px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.66), rgba(204, 247, 255, 0.3));
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: 0 22px 50px rgba(23, 67, 91, 0.1);
  color: #315161;
}

.welcome-badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(98, 231, 255, 0.18);
  border: 1px solid rgba(98, 231, 255, 0.3);
  color: #16849f;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.welcome-panel h2 {
  margin: 18px 0 12px;
  font-size: 28px;
  line-height: 1.2;
  color: #1e3341;
}

.welcome-panel p {
  margin: 0 0 12px;
  line-height: 1.7;
}

.welcome-panel ul {
  margin: 18px 0 0;
  padding-left: 1.25rem;
}

.welcome-panel li {
  margin-bottom: 8px;
}

.chat-message {
  display: flex;
  margin-bottom: 24px;
  padding: 0 24px;
}

.ai-message {
  justify-content: flex-start;
  flex-direction: row;
}

.message-avatar {
  display: flex;
  align-items: flex-start;
  margin: 0 12px;
}

.avatar-shell {
  width: 46px;
  height: 46px;
  padding: 3px;
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.78), rgba(105, 225, 255, 0.18));
  box-shadow: 0 10px 28px rgba(34, 79, 110, 0.16);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 13px;
  display: block;
}

.message-content {
  max-width: min(72%, 860px);
  min-width: 120px;
}

.message-bubble {
  padding: 16px 18px;
  border-radius: 24px;
  border-bottom-left-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(212, 248, 255, 0.52));
  color: #20323f;
  box-shadow: 0 20px 45px rgba(32, 73, 102, 0.08);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.ai-typing-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-response-text {
  font-size: 14px;
  line-height: 1.75;
}

.message-markdown :deep(h1),
.message-markdown :deep(h2),
.message-markdown :deep(h3),
.message-markdown :deep(h4),
.message-markdown :deep(h5),
.message-markdown :deep(h6) {
  margin: 0.75em 0 0.45em;
  font-weight: 700;
  line-height: 1.35;
}

.message-markdown :deep(h1) { font-size: 1.5em; }
.message-markdown :deep(h2) { font-size: 1.32em; }
.message-markdown :deep(h3) { font-size: 1.18em; }
.message-markdown :deep(h4) { font-size: 1.05em; }
.message-markdown :deep(h5) { font-size: 1em; }
.message-markdown :deep(h6) { font-size: 0.95em; }

.message-markdown :deep(p) {
  margin: 0.5em 0;
}

.message-markdown :deep(ul),
.message-markdown :deep(ol) {
  margin: 0.6em 0;
  padding-left: 1.5em;
}

.message-markdown :deep(li) {
  margin: 0.25em 0;
}

.message-markdown :deep(code) {
  background-color: rgba(19, 53, 72, 0.08);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.92em;
}

.message-markdown :deep(pre) {
  background-color: rgba(18, 52, 71, 0.08);
  padding: 1em;
  border-radius: 12px;
  overflow-x: auto;
  margin: 0.75em 0;
}

.message-markdown :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.message-markdown :deep(blockquote) {
  border-left: 4px solid rgba(88, 202, 232, 0.5);
  padding-left: 1em;
  margin: 0.75em 0;
  color: #537082;
}

.message-markdown :deep(a) {
  color: #137c9b;
  text-decoration: underline;
}

.message-markdown :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.75em 0;
}

.message-markdown :deep(th),
.message-markdown :deep(td) {
  border: 1px solid rgba(71, 103, 122, 0.16);
  padding: 0.55em;
  text-align: left;
}

.message-markdown :deep(th) {
  background-color: rgba(199, 240, 249, 0.48);
  font-weight: bold;
}

.message-markdown :deep(hr) {
  border: none;
  border-top: 1px solid rgba(71, 103, 122, 0.18);
  margin: 1em 0;
}

.connection-error {
  position: fixed;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(255, 104, 160, 0.95), rgba(255, 132, 186, 0.92));
  color: white;
  padding: 12px 20px;
  border-radius: 16px;
  z-index: 10;
  box-shadow: 0 16px 34px rgba(255, 104, 160, 0.28);
}

.error-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  font-size: 16px;
  font-weight: 700;
}

.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(116, 179, 198, 0.34);
  border-radius: 999px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(116, 179, 198, 0.48);
}

@media (max-width: 768px) {
  .app-shell {
    padding: 10px;
  }

  .app-header {
    padding: 14px 16px;
    border-radius: 22px;
  }

  .brand {
    gap: 12px;
  }

  .brand-logo-shell {
    width: 48px;
    height: 48px;
    border-radius: 16px;
  }

  .brand-logo {
    border-radius: 12px;
  }

  .app-title {
    font-size: 22px;
  }

  .app-subtitle {
    font-size: 12px;
  }

  .chat-container {
    margin-top: 12px;
    border-radius: 24px;
  }

  .messages-container {
    padding-top: 18px;
  }

  .welcome-message {
    padding: 0 12px;
  }

  .welcome-panel {
    padding: 22px 20px;
    border-radius: 24px;
  }

  .welcome-panel h2 {
    font-size: 22px;
  }

  .message-content {
    max-width: 86%;
  }

  .chat-message {
    padding: 0 12px;
    margin-bottom: 18px;
  }

  .avatar-shell {
    width: 40px;
    height: 40px;
    border-radius: 14px;
  }

  .avatar-image {
    border-radius: 11px;
  }
}
</style>

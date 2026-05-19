<template>
  <div class="chat-message" :class="{ 'user-message': isUser, 'ai-message': !isUser }">
    <div class="message-avatar">
      <div class="avatar-shell">
        <img :src="avatarSrc" :alt="isUser ? '用户头像' : 'AI 头像'" class="avatar-image" />
      </div>
    </div>
    <div class="message-content">
      <div class="message-bubble">
        <pre v-if="isUser" class="message-text">{{ message }}</pre>
        <div v-else class="message-markdown" v-html="renderedMessage"></div>
      </div>
      <div class="message-time">{{ formatTime(timestamp) }}</div>
    </div>
  </div>
</template>

<script>
import { formatTime } from '../utils/index.js'
import { marked } from 'marked'

const aiAvatar = new URL('../../ai-logo.jpg', import.meta.url).href
const userAvatar = new URL('../../user.jpg', import.meta.url).href

function normalizeMarkdown(content) {
  if (!content) {
    return ''
  }

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
  name: 'ChatMessage',
  props: {
    message: {
      type: String,
      required: true
    },
    isUser: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: () => new Date()
    }
  },
  computed: {
    avatarSrc() {
      return this.isUser ? userAvatar : aiAvatar
    },
    renderedMessage() {
      if (this.isUser) {
        return this.message
      }
      return marked(normalizeMarkdown(this.message))
    }
  },
  methods: {
    formatTime
  }
}
</script>

<style scoped>
.chat-message {
  display: flex;
  margin-bottom: 24px;
  padding: 0 24px;
}

.user-message {
  justify-content: flex-end;
  flex-direction: row;
}

.user-message .message-avatar {
  order: 2;
}

.user-message .message-content {
  order: 1;
}

.ai-message {
  justify-content: flex-start;
  flex-direction: row;
}

.ai-message .message-avatar {
  order: 1;
}

.ai-message .message-content {
  order: 2;
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
  position: relative;
  word-wrap: break-word;
  word-break: break-word;
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: 0 20px 45px rgba(32, 73, 102, 0.08);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.user-message .message-bubble {
  background: linear-gradient(135deg, rgba(255, 235, 244, 0.96), rgba(255, 215, 235, 0.92));
  color: #4b2940;
  border-bottom-right-radius: 8px;
}

.ai-message .message-bubble {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(212, 248, 255, 0.52));
  color: #20323f;
  border-bottom-left-radius: 8px;
}

.message-text {
  font-family: inherit;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  margin: 0;
}

.message-markdown {
  font-family: inherit;
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

.message-time {
  font-size: 12px;
  color: rgba(55, 82, 96, 0.72);
  margin-top: 8px;
  padding: 0 6px;
}

.user-message .message-time {
  text-align: right;
}

.ai-message .message-time {
  text-align: left;
}

@media (max-width: 768px) {
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

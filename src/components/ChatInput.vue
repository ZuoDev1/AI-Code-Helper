<template>
  <div class="chat-input">
    <div class="input-container">
      <textarea
        ref="inputRef"
        v-model="inputMessage"
        :placeholder="placeholder"
        :disabled="disabled"
        class="input-textarea"
        rows="1"
        @keydown="handleKeyDown"
        @input="adjustHeight"
      />
      <button
        :disabled="disabled || !inputMessage.trim()"
        @click="sendMessage"
        class="send-button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatInput',
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '请输入您的问题...'
    }
  },
  data() {
    return {
      inputMessage: ''
    }
  },
  methods: {
    sendMessage() {
      if (this.inputMessage.trim() && !this.disabled) {
        this.$emit('send-message', this.inputMessage.trim())
        this.inputMessage = ''
        this.adjustHeight()
      }
    },
    handleKeyDown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        this.sendMessage()
      }
    },
    adjustHeight() {
      this.$nextTick(() => {
        const textarea = this.$refs.inputRef
        textarea.style.height = 'auto'
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
      })
    },
    focus() {
      this.$refs.inputRef.focus()
    }
  },
  mounted() {
    this.adjustHeight()
  }
}
</script>

<style scoped>
.chat-input {
  padding: 18px 22px 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.28));
  border-top: 1px solid rgba(255, 255, 255, 0.26);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  max-width: 920px;
  margin: 0 auto;
  padding: 10px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.54), rgba(203, 248, 255, 0.22));
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 18px 40px rgba(27, 72, 95, 0.12);
}

.input-textarea {
  flex: 1;
  padding: 14px 18px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 22px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s, background-color 0.25s;
  min-height: 48px;
  max-height: 120px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.72);
  color: #27404d;
}

.input-textarea::placeholder {
  color: rgba(81, 105, 118, 0.78);
}

.input-textarea:focus {
  border-color: rgba(255, 131, 185, 0.72);
  box-shadow: 0 0 0 4px rgba(255, 179, 212, 0.22);
}

.input-textarea:disabled {
  background-color: rgba(245, 245, 245, 0.7);
  color: #999;
  cursor: not-allowed;
}

.send-button {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ff8fbe, #ff6ca8);
  border: none;
  border-radius: 18px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
  flex-shrink: 0;
  box-shadow: 0 14px 28px rgba(255, 108, 168, 0.34);
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px) scale(1.02);
  filter: saturate(1.05);
  box-shadow: 0 18px 34px rgba(255, 108, 168, 0.4);
}

.send-button:disabled {
  background: linear-gradient(135deg, #d8d8d8, #bfbfbf);
  box-shadow: none;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .chat-input {
    padding: 14px 12px 18px;
  }

  .input-container {
    gap: 8px;
    padding: 8px;
  }

  .input-textarea {
    font-size: 16px;
  }

  .send-button {
    width: 44px;
    height: 44px;
    border-radius: 16px;
  }
}
</style>

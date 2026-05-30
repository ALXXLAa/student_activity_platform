<template>
  <div class="ai-assistant-container">
    <div class="chat-header">
      <div class="header-content">
        <span class="ai-icon">🤖</span>
        <h2>AI 助手</h2>
      </div>
      <p class="header-subtitle">有什么可以帮助您的？</p>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div class="message ai-message">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <p>您好！我是您的 AI 助手，请问有什么可以帮助您的？</p>
        </div>
      </div>
      
      <div 
        v-for="(msg, index) in messages" 
        :key="index"
        :class="['message', msg.type === 'user' ? 'user-message' : 'ai-message']"
      >
        <div class="message-avatar">{{ msg.type === 'user' ? '👤' : '🤖' }}</div>
        <div class="message-content">
          <p>{{ msg.content }}</p>
        </div>
      </div>

      <div v-if="isLoading" class="message ai-message loading">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <button 
        v-for="topic in helpTopics" 
        :key="topic.topic"
        @click="sendQuickMessage(topic.topic)"
        class="quick-btn"
      >
        {{ topic.topic }}
      </button>
    </div>

    <div class="chat-input">
      <input 
        v-model="inputMessage" 
        @keyup.enter="sendMessage" 
        type="text" 
        placeholder="输入您的问题..."
        class="message-input"
        :disabled="isLoading"
      />
      <button @click="sendMessage" class="send-btn" :disabled="isLoading || !inputMessage.trim()">
        <span>发送</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';

interface Message {
  type: 'user' | 'ai';
  content: string;
}

interface HelpTopic {
  topic: string;
  description: string;
}

const messages = ref<Message[]>([]);
const inputMessage = ref('');
const isLoading = ref(false);
const helpTopics = ref<HelpTopic[]>([]);
const messagesContainer = ref<HTMLElement | null>(null);

const fetchHelpTopics = async () => {
  try {
    const response = await axios.get('/api/ai/help', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    helpTopics.value = response.data.helpTopics;
  } catch (error) {
    console.error('获取帮助主题失败:', error);
  }
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  const userMessage = inputMessage.value.trim();
  messages.value.push({ type: 'user', content: userMessage });
  inputMessage.value = '';
  isLoading.value = true;

  await scrollToBottom();

  try {
    const response = await axios.post('/api/ai/chat', { message: userMessage }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    messages.value.push({ type: 'ai', content: response.data.response });
  } catch (error) {
    messages.value.push({ type: 'ai', content: '抱歉，我现在无法回答您的问题，请稍后再试。' });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
};

const sendQuickMessage = (topic: string) => {
  inputMessage.value = topic;
  sendMessage();
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

onMounted(() => {
  fetchHelpTopics();
});
</script>

<style scoped>
.ai-assistant-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chat-header {
  padding: 2rem;
  text-align: center;
  color: white;
  background: rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.ai-icon {
  font-size: 2.5rem;
}

.chat-header h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.header-subtitle {
  margin: 0.5rem 0 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  gap: 1rem;
  max-width: 80%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.message-content {
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  line-height: 1.5;
}

.user-message {
  align-self: flex-end;
}

.user-message .message-content {
  background: #4a5568;
  color: white;
  border-bottom-right-radius: 0.25rem;
}

.ai-message .message-content {
  background: white;
  color: #2d3748;
  border-bottom-left-radius: 0.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-content p {
  margin: 0;
  white-space: pre-wrap;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 0.5rem;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #a0aec0;
  border-radius: 50%;
  animation: typing 1.4s ease-in-out infinite;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
}

.quick-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 2rem;
  color: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.chat-input {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.message-input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: none;
  border-radius: 2rem;
  font-size: 1rem;
  background: white;
  color: #2d3748;
}

.message-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}

.message-input::placeholder {
  color: #a0aec0;
}

.message-input:disabled {
  opacity: 0.6;
}

.send-btn {
  padding: 0.875rem 1.75rem;
  background: #4a5568;
  border: none;
  border-radius: 2rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  background: #2d3748;
  transform: translateY(-2px);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
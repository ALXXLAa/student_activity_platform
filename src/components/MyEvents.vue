<template>
  <div class="my-events-container">
    <div class="page-header">
      <h1>我的活动</h1>
      <router-link to="/events/create" class="create-btn">
        + 发布新活动
      </router-link>
    </div>

    <div class="events-list">
      <div 
        v-for="event in events" 
        :key="event.id" 
        class="event-item"
      >
        <div class="event-info">
          <h3 class="event-title">{{ event.title }}</h3>
          <p class="event-description">{{ event.description }}</p>
          <div class="event-meta">
            <span>📅 {{ formatDateTime(event.start_time) }}</span>
            <span>🏢 {{ event.location }}</span>
            <span>👥 {{ event.max_participants }}人</span>
          </div>
        </div>
        
        <div class="event-status">
          <span :class="['status-badge', event.status]">{{ getStatusText(event.status) }}</span>
        </div>

        <div class="event-actions">
          <router-link :to="`/events/${event.id}`" class="view-btn">查看详情</router-link>
          <router-link :to="`/events/${event.id}/edit`" class="edit-btn">编辑</router-link>
        </div>
      </div>
    </div>

    <div v-if="events.length === 0" class="empty-state">
      <p>您还没有发布任何活动</p>
      <router-link to="/events/create" class="create-link">发布第一个活动</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as eventApi from '../api/event';
import type { Event } from '../api/event';

const events = ref<Event[]>([]);

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    active: '进行中',
    pending: '待审核',
    completed: '已结束'
  };
  return map[status] || status;
};

const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const loadEvents = async () => {
  try {
    events.value = await eventApi.getMyEvents();
  } catch (error) {
    console.error('加载活动失败:', error);
  }
};

onMounted(() => {
  loadEvents();
});
</script>

<style scoped>
.my-events-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  color: #333;
}

.create-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-item {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.event-info {
  flex: 1;
}

.event-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.event-description {
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #555;
}

.event-status {
  margin-right: 1.5rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #dcfce7;
  color: #16a34a;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-badge.completed {
  background-color: #e5e7eb;
  color: #6b7280;
}

.event-actions {
  display: flex;
  gap: 0.75rem;
}

.view-btn,
.edit-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.view-btn {
  background-color: #f1f5f9;
  color: #334155;
}

.view-btn:hover {
  background-color: #e2e8f0;
}

.edit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.empty-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.empty-state p {
  color: #999;
  margin-bottom: 1rem;
}

.create-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.create-link:hover {
  text-decoration: underline;
}
</style>

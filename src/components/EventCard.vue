<template>
  <div class="event-card">
    <div class="event-header">
      <span :class="['status-badge', event.status]">{{ getStatusText(event.status) }}</span>
      <button 
        @click="$emit('toggle-favorite', event.id)" 
        :class="['favorite-btn', { active: isFavorite }]"
        title="收藏"
      >
        {{ isFavorite ? '❤️' : '🤍' }}
      </button>
    </div>

    <h3 class="event-title">{{ event.title }}</h3>
    
    <p class="event-description">{{ event.description }}</p>

    <div class="event-meta">
      <div class="meta-item">
        📅 {{ formatDateTime(event.start_time) }}
      </div>
      <div class="meta-item">
        🏢 {{ event.location }}
      </div>
      <div class="meta-item">
        👥 {{ event.max_participants }}人
      </div>
      <div class="meta-item">
        📢 {{ event.organizer }}
      </div>
    </div>

    <div class="event-footer">
      <span class="creator">创建者: {{ event.username }}</span>
      <router-link :to="`/events/${event.id}`" class="view-detail">查看详情</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '../api/event';

defineProps<{
  event: Event;
  isFavorite: boolean;
}>();

defineEmits(['toggle-favorite']);

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
</script>

<style scoped>
.event-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.event-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
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

.favorite-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.favorite-btn:hover {
  background-color: #fef2f2;
}

.event-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
}

.event-description {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  font-size: 0.9rem;
  color: #555;
}

.event-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.creator {
  font-size: 0.85rem;
  color: #888;
}

.view-detail {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.view-detail:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>

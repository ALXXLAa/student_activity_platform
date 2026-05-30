<template>
  <div class="my-favorites-container">
    <h1 class="page-title">我的收藏</h1>

    <div class="favorites-list">
      <div 
        v-for="favorite in favorites" 
        :key="favorite.id" 
        class="favorite-item"
      >
        <div class="event-info">
          <h3 class="event-title">{{ favorite.event?.title }}</h3>
          <div class="event-meta">
            <span>📅 {{ formatDateTime(favorite.event?.start_time || '') }}</span>
            <span>🏢 {{ favorite.event?.location }}</span>
            <span :class="['status-badge', favorite.event?.status]">{{ getStatusText(favorite.event?.status || '') }}</span>
          </div>
        </div>

        <div class="favorite-actions">
          <router-link :to="`/events/${favorite.event_id}`" class="view-btn">查看详情</router-link>
          <button 
            @click="handleRemove(favorite.event_id)" 
            class="remove-btn"
          >
            取消收藏
          </button>
        </div>
      </div>
    </div>

    <div v-if="favorites.length === 0" class="empty-state">
      <p>您还没有收藏任何活动</p>
      <router-link to="/" class="explore-link">探索活动</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as eventApi from '../api/event';
import type { Favorite } from '../api/event';

const favorites = ref<Favorite[]>([]);

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

const handleRemove = async (eventId: number) => {
  if (!confirm('确定要取消收藏吗？')) return;
  
  try {
    await eventApi.removeFavorite(eventId);
    favorites.value = favorites.value.filter(f => f.event_id !== eventId);
  } catch (error) {
    console.error('取消收藏失败:', error);
  }
};

const loadFavorites = async () => {
  try {
    favorites.value = await eventApi.getFavorites();
  } catch (error) {
    console.error('加载收藏失败:', error);
  }
};

onMounted(() => {
  loadFavorites();
});
</script>

<style scoped>
.my-favorites-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.page-title {
  font-size: 1.75rem;
  color: #333;
  margin-bottom: 2rem;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.favorite-item {
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

.event-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #555;
}

.status-badge {
  padding: 0.3rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
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

.favorite-actions {
  display: flex;
  gap: 0.75rem;
}

.view-btn,
.remove-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.view-btn {
  background-color: #f1f5f9;
  color: #334155;
}

.view-btn:hover {
  background-color: #e2e8f0;
}

.remove-btn {
  background-color: #fee2e2;
  color: #dc2626;
}

.remove-btn:hover {
  background-color: #fecaca;
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

.explore-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.explore-link:hover {
  text-decoration: underline;
}
</style>

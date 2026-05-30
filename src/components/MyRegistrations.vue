<template>
  <div class="my-registrations-container">
    <h1 class="page-title">我的报名</h1>

    <div class="registrations-list">
      <div 
        v-for="registration in registrations" 
        :key="registration.id" 
        class="registration-item"
      >
        <div class="event-info">
          <h3 class="event-title">{{ registration.event?.title }}</h3>
          <div class="event-meta">
            <span>📅 {{ formatDateTime(registration.event?.start_time || '') }}</span>
            <span>🏢 {{ registration.event?.location }}</span>
          </div>
        </div>

        <div class="registration-status">
          <span :class="['status-badge', registration.status]">{{ getStatusText(registration.status) }}</span>
        </div>

        <div class="registration-actions">
          <router-link :to="`/events/${registration.event_id}`" class="view-btn">查看详情</router-link>
          <button 
            v-if="registration.status === 'pending'"
            @click="handleCancel(registration.id)" 
            class="cancel-btn"
          >
            取消报名
          </button>
        </div>
      </div>
    </div>

    <div v-if="registrations.length === 0" class="empty-state">
      <p>您还没有报名任何活动</p>
      <router-link to="/" class="explore-link">探索活动</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as eventApi from '../api/event';
import type { Registration } from '../api/event';

const registrations = ref<Registration[]>([]);

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
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

const handleCancel = async (registrationId: number) => {
  if (!confirm('确定要取消报名吗？')) return;
  
  try {
    await eventApi.cancelRegistration(registrationId);
    registrations.value = registrations.value.filter(r => r.id !== registrationId);
  } catch (error) {
    console.error('取消报名失败:', error);
  }
};

const loadRegistrations = async () => {
  try {
    registrations.value = await eventApi.getRegistrations();
  } catch (error) {
    console.error('加载报名信息失败:', error);
  }
};

onMounted(() => {
  loadRegistrations();
});
</script>

<style scoped>
.my-registrations-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.page-title {
  font-size: 1.75rem;
  color: #333;
  margin-bottom: 2rem;
}

.registrations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.registration-item {
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

.registration-status {
  margin-right: 1.5rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-badge.approved {
  background-color: #dcfce7;
  color: #16a34a;
}

.status-badge.rejected {
  background-color: #fee2e2;
  color: #dc2626;
}

.registration-actions {
  display: flex;
  gap: 0.75rem;
}

.view-btn,
.cancel-btn {
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

.cancel-btn {
  background-color: #fee2e2;
  color: #dc2626;
}

.cancel-btn:hover {
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

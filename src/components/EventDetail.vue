<template>
  <div class="event-detail-container">
    <div class="event-card">
      <div class="event-header">
        <span :class="['status-badge', event.status]">{{ getStatusText(event.status) }}</span>
        <button @click="handleToggleFavorite" :class="['favorite-btn', { active: isFavorite }]" title="收藏">
          {{ isFavorite ? '❤️' : '🤍' }}
        </button>
      </div>

      <h1 class="event-title">{{ event.title }}</h1>

      <div class="event-info">
        <div class="info-row">
          <div class="info-item">
            <span class="info-icon">📅</span>
            <span>{{ formatDateTime(event.start_time) }}</span>
          </div>
          <div class="info-item">
            <span class="info-icon">🏢</span>
            <span>{{ event.location }}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="info-icon">👥</span>
            <span>最大参与人数: {{ event.max_participants }}人</span>
          </div>
          <div class="info-item">
            <span class="info-icon">📢</span>
            <span>{{ event.organizer }}</span>
          </div>
        </div>
      </div>

      <div class="event-description">
        <h3>活动描述</h3>
        <p>{{ event.description }}</p>
      </div>

      <div class="event-actions">
        <button v-if="event.created_by === userId" @click="router.push(`/events/${event.id}/edit`)" class="edit-btn">
          编辑活动
        </button>

        <button v-if="!isRegistered && event.status === 'active'" @click="handleRegister" :disabled="isLoading"
          class="register-btn">
          {{ isLoading ? '报名中...' : '立即报名' }}
        </button>

        <button v-else-if="isRegistered" @click="handleCancelRegistration" class="cancel-btn">
          取消报名
        </button>

        <button v-if="event.created_by === userId" @click="showRegistrations = !showRegistrations" class="view-reg-btn">
          {{ showRegistrations ? '隐藏报名列表' : '查看报名列表' }}
        </button>

        <button v-if="event.created_by === userId && event.status === 'pending'" @click="handleApproveEvent" class="approve-event-btn">
          审核通过
        </button>

        <button v-if="event.created_by === userId && event.status === 'active'" @click="handleCompleteEvent" class="complete-event-btn">
          结束活动
        </button>

        <button v-if="event.created_by === userId" @click="handleDeleteEvent" class="delete-btn">
          删除活动
        </button>
      </div>

      <div v-if="showRegistrations" class="registrations-section">
        <h3>报名列表</h3>
        <div v-if="registrations.length === 0" class="empty-list">
          暂无报名
        </div>
        <div v-else class="registrations-list">
          <div v-for="reg in registrations" :key="reg.id" class="registration-item">
            <span class="reg-user">{{ reg.username }}</span>
            <span :class="['reg-status', reg.status]">{{ getRegistrationStatus(reg.status) }}</span>
            <div v-if="event.created_by === userId" class="reg-actions">
              <button v-if="reg.status === 'pending'" @click="handleUpdateRegistration(reg.id, 'approved')"
                class="approve-btn">
                通过
              </button>
              <button v-if="reg.status === 'pending'" @click="handleUpdateRegistration(reg.id, 'rejected')"
                class="reject-btn">
                拒绝
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="comments-section">
        <h3>评论 ({{ comments.length }})</h3>

        <div class="comment-form">
          <textarea v-model="newComment" rows="2" placeholder="发表评论..."></textarea>
          <button @click="handleAddComment" class="submit-comment-btn">
            发表
          </button>
        </div>

        <div v-if="comments.length === 0" class="empty-comments">
          暂无评论
        </div>

        <div v-else class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <span class="comment-user">{{ comment.username }}</span>
              <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
              <button v-if="comment.user_id === userId" @click="handleDeleteComment(comment.id)"
                class="delete-comment-btn">
                删除
              </button>
            </div>
            <p class="comment-content">{{ comment.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../stores/user';
import * as eventApi from '../api/event';
import type { Event, Registration, Comment } from '../api/event';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const event = ref<Event>({} as Event);
const isFavorite = ref(false);
const isRegistered = ref(false);
const registrations = ref<Registration[]>([]);
const comments = ref<Comment[]>([]);
const showRegistrations = ref(false);
const newComment = ref('');
const isLoading = ref(false);

const userId = computed(() => {
  const id = userStore.user?.id;
  return id ? Number(id) : null;
});

const loadEvent = async () => {
  try {
    const eventId = Number(route.params.id);
    event.value = await eventApi.getEventById(eventId);

    // 检查是否收藏
    const favCheck = await eventApi.checkFavorite(eventId);
    isFavorite.value = favCheck.isFavorite;

    // 获取评论
    comments.value = await eventApi.getComments(eventId);

    // 获取报名信息
    if (event.value.created_by === userId.value) {
      registrations.value = await eventApi.getRegistrations(eventId);
    }

    // 检查当前用户是否已报名
    const myRegistrations = await eventApi.getRegistrations();
    isRegistered.value = myRegistrations.some(r => r.event_id === eventId);

  } catch (error) {
    console.error('加载活动失败:', error);
    router.push('/');
  }
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    active: '进行中',
    pending: '待审核',
    completed: '已结束'
  };
  return map[status] || status;
};

const getRegistrationStatus = (status: string) => {
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

const formatTime = (dateTime: string) => {
  const date = new Date(dateTime);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleToggleFavorite = async () => {
  try {
    const eventId = Number(route.params.id);
    if (isFavorite.value) {
      await eventApi.removeFavorite(eventId);
      isFavorite.value = false;
    } else {
      await eventApi.addFavorite(eventId);
      isFavorite.value = true;
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
};

const handleRegister = async () => {
  isLoading.value = true;
  try {
    const eventId = Number(route.params.id);
    await eventApi.registerEvent(eventId);
    isRegistered.value = true;
  } catch (error) {
    console.error('报名失败:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleCancelRegistration = async () => {
  if (!confirm('确定要取消报名吗？')) return;

  try {
    const eventId = Number(route.params.id);
    const myRegistrations = await eventApi.getRegistrations();
    const registration = myRegistrations.find(r => r.event_id === eventId);

    if (registration) {
      await eventApi.cancelRegistration(registration.id);
      isRegistered.value = false;
    }
  } catch (error) {
    console.error('取消报名失败:', error);
  }
};

const handleUpdateRegistration = async (registrationId: number, status: 'approved' | 'rejected') => {
  try {
    await eventApi.updateRegistrationStatus(registrationId, status);
    const index = registrations.value.findIndex(r => r.id === registrationId);
    if (index !== -1) {
      registrations.value[index].status = status;
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
};

const handleAddComment = async () => {
  if (!newComment.value.trim()) return;

  try {
    const eventId = Number(route.params.id);
    const comment = await eventApi.addComment(eventId, newComment.value);
    comments.value.unshift(comment);
    newComment.value = '';
  } catch (error) {
    console.error('发表评论失败:', error);
  }
};

const handleDeleteComment = async (commentId: number) => {
  if (!confirm('确定要删除这条评论吗？')) return;

  try {
    await eventApi.deleteComment(commentId);
    comments.value = comments.value.filter(c => c.id !== commentId);
  } catch (error) {
    console.error('删除评论失败:', error);
  }
};

const handleApproveEvent = async () => {
  if (!confirm('确定要审核通过此活动吗？活动将变为进行中状态。')) return;

  try {
    const eventId = Number(route.params.id);
    const updatedEvent = await eventApi.updateEventStatus(eventId, 'active');
    event.value = updatedEvent;
  } catch (error) {
    console.error('审核失败:', error);
  }
};

const handleCompleteEvent = async () => {
  if (!confirm('确定要结束此活动吗？活动将变为已结束状态。')) return;

  try {
    const eventId = Number(route.params.id);
    const updatedEvent = await eventApi.updateEventStatus(eventId, 'completed');
    event.value = updatedEvent;
  } catch (error) {
    console.error('结束活动失败:', error);
  }
};

const handleDeleteEvent = async () => {
  if (!confirm('确定要删除这个活动吗？此操作将无法撤销。')) return;

  try {
    const eventId = Number(route.params.id);
    await eventApi.deleteEvent(eventId);
    router.push('/');
  } catch (error) {
    console.error('删除活动失败:', error);
  }
};

onMounted(() => {
  loadEvent();
});
</script>

<style scoped>
.event-detail-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.event-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
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
  font-size: 1.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.favorite-btn:hover {
  background-color: #fef2f2;
}

.event-title {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
}

.event-info {
  margin-bottom: 2rem;
}

.info-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: #555;
}

.info-icon {
  font-size: 1.2rem;
}

.event-description {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.event-description h3 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  color: #333;
}

.event-description p {
  line-height: 1.6;
  color: #555;
}

.event-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.edit-btn,
.register-btn,
.cancel-btn,
.view-reg-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.edit-btn {
  background-color: #f1f5f9;
  color: #334155;
}

.edit-btn:hover {
  background-color: #e2e8f0;
}

.register-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #fee2e2;
  color: #dc2626;
}

.cancel-btn:hover {
  background-color: #fecaca;
}

.view-reg-btn {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.view-reg-btn:hover {
  background-color: #bfdbfe;
}

.delete-btn {
  background-color: #ef4444;
  color: white;
}

.delete-btn:hover {
  background-color: #dc2626;
}

.approve-event-btn {
  background-color: #22c55e;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.approve-event-btn:hover {
  background-color: #16a34a;
}

.complete-event-btn {
  background-color: #f59e0b;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.complete-event-btn:hover {
  background-color: #d97706;
}

.registrations-section {
  margin-bottom: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.registrations-section h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
}

.empty-list {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.registrations-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.registration-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.reg-user {
  font-weight: 500;
  color: #333;
}

.reg-status {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.reg-status.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.reg-status.approved {
  background-color: #dcfce7;
  color: #16a34a;
}

.reg-status.rejected {
  background-color: #fee2e2;
  color: #dc2626;
}

.reg-actions {
  display: flex;
  gap: 0.5rem;
}

.approve-btn,
.reject-btn {
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.approve-btn {
  background-color: #dcfce7;
  color: #16a34a;
}

.approve-btn:hover {
  background-color: #bbf7d0;
}

.reject-btn {
  background-color: #fee2e2;
  color: #dc2626;
}

.reject-btn:hover {
  background-color: #fecaca;
}

.comments-section {
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.comments-section h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
}

.comment-form {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.comment-form textarea {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 0.95rem;
  resize: none;
}

.comment-form textarea:focus {
  outline: none;
  border-color: #667eea;
}

.submit-comment-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
}

.submit-comment-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.empty-comments {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.comment-user {
  font-weight: 500;
  color: #333;
}

.comment-time {
  font-size: 0.85rem;
  color: #999;
}

.delete-comment-btn {
  margin-left: auto;
  padding: 0.3rem 0.75rem;
  background-color: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.comment-content {
  color: #555;
  line-height: 1.5;
}
</style>

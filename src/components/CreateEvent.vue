<template>
  <div class="create-event-container">
    <div class="form-card">
      <h2 class="form-title">发布活动</h2>

      <form @submit.prevent="handleSubmit" class="event-form">
        <div class="form-row">
          <div class="form-group">
            <label for="title">活动标题 *</label>
            <input id="title" v-model="formData.title" type="text" placeholder="请输入活动标题" required
              :class="{ 'error': errors.title }" />
            <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
          </div>

          <div class="form-group">
            <label for="organizer">主办方 *</label>
            <input id="organizer" v-model="formData.organizer" type="text" placeholder="请输入主办方名称" required
              :class="{ 'error': errors.organizer }" />
            <span v-if="errors.organizer" class="error-message">{{ errors.organizer }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="location">活动地点 *</label>
            <input id="location" v-model="formData.location" type="text" placeholder="请输入活动地点" required
              :class="{ 'error': errors.location }" />
            <span v-if="errors.location" class="error-message">{{ errors.location }}</span>
          </div>

          <div class="form-group">
            <label for="max_participants">最大参与人数 *</label>
            <input id="max_participants" v-model.number="formData.max_participants" type="number" min="1"
              placeholder="请输入最大参与人数" required :class="{ 'error': errors.max_participants }" />
            <span v-if="errors.max_participants" class="error-message">{{ errors.max_participants }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="start_time">开始时间 *</label>
            <input id="start_time" v-model="formData.start_time" type="datetime-local" required
              :class="{ 'error': errors.start_time }" />
            <span v-if="errors.start_time" class="error-message">{{ errors.start_time }}</span>
          </div>

          <div class="form-group">
            <label for="end_time">结束时间 *</label>
            <input id="end_time" v-model="formData.end_time" type="datetime-local" required
              :class="{ 'error': errors.end_time }" />
            <span v-if="errors.end_time" class="error-message">{{ errors.end_time }}</span>
          </div>
        </div>

        <div class="form-group">
          <label for="description">活动描述 *</label>
          <textarea id="description" v-model="formData.description" rows="4" placeholder="请输入活动描述" required
            :class="{ 'error': errors.description }"></textarea>
          <span v-if="errors.description" class="error-message">{{ errors.description }}</span>
        </div>

        <div class="form-actions">
          <button type="button" @click="router.push('/')" class="cancel-btn">取消</button>
          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoading ? '发布中...' : '发布活动' }}
          </button>
        </div>
      </form>

      <div v-if="submitError" class="error-alert">
        {{ submitError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import * as eventApi from '../api/event';

const router = useRouter();
const isLoading = ref(false);
const submitError = ref('');

const formData = reactive({
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  location: '',
  organizer: '',
  max_participants: 100
});

const errors = reactive({
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  location: '',
  organizer: '',
  max_participants: ''
});

const validateForm = () => {
  let isValid = true;
  (Object.keys(errors) as (keyof typeof errors)[]).forEach(key => errors[key] = '');

  if (!formData.title.trim()) {
    errors.title = '请输入活动标题';
    isValid = false;
  }

  if (!formData.description.trim()) {
    errors.description = '请输入活动描述';
    isValid = false;
  }

  if (!formData.start_time) {
    errors.start_time = '请选择开始时间';
    isValid = false;
  }

  if (!formData.end_time) {
    errors.end_time = '请选择结束时间';
    isValid = false;
  }

  if (!formData.location.trim()) {
    errors.location = '请输入活动地点';
    isValid = false;
  }

  if (!formData.organizer.trim()) {
    errors.organizer = '请输入主办方名称';
    isValid = false;
  }

  if (!formData.max_participants || formData.max_participants < 1) {
    errors.max_participants = '请输入有效的参与人数';
    isValid = false;
  }

  if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
    errors.end_time = '结束时间必须晚于开始时间';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  submitError.value = '';

  try {
    await eventApi.createEvent({
      title: formData.title,
      description: formData.description,
      start_time: formData.start_time.replace('T', ' ') + ':00',
      end_time: formData.end_time.replace('T', ' ') + ':00',
      location: formData.location,
      organizer: formData.organizer,
      max_participants: formData.max_participants
    });

    router.push('/');
  } catch (error: any) {
    submitError.value = error.message || '发布失败';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.create-event-container {
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.form-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 700px;
}

.form-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 2rem;
}

.event-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input.error,
.form-group textarea.error {
  border-color: #ef4444;
}

.form-group textarea {
  resize: vertical;
}

.error-message {
  font-size: 0.85rem;
  color: #ef4444;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.submit-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-alert {
  padding: 1rem;
  background-color: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
}
</style>

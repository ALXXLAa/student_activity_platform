<template>
  <div class="home-container">
    <div class="hero-section">
      <h1>🎉 校园活动平台</h1>
      <p>发现精彩活动，参与校园生活</p>
    </div>

    <div class="events-section">
      <div class="section-header">
        <h2>近期活动</h2>
        <div class="filter-bar">
          <button 
            v-for="filter in filters" 
            :key="filter.value"
            @click="activeFilter = filter.value"
            :class="['filter-btn', { active: activeFilter === filter.value }]"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <div class="events-grid">
        <EventCard 
          v-for="event in filteredEvents" 
          :key="event.id" 
          :event="event"
          :isFavorite="isFavorite(event.id)"
          @toggle-favorite="(eventId) => handleToggleFavorite(eventId)"
        />
      </div>

      <div v-if="filteredEvents.length === 0" class="empty-state">
        <p>暂无活动</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import EventCard from '../components/EventCard.vue';
import * as eventApi from '../api/event';
import type { Event } from '../api/event';

const route = useRoute();
const events = ref<Event[]>([]);
const favorites = ref<number[]>([]);
const activeFilter = ref('all');

const filters = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '待审核', value: 'pending' },
  { label: '已结束', value: 'completed' }
];

const filteredEvents = computed(() => {
  if (activeFilter.value === 'all') return events.value;
  return events.value.filter(event => event.status === activeFilter.value);
});

const isFavorite = (eventId: number) => {
  return favorites.value.includes(eventId);
};

const handleToggleFavorite = async (eventId: number) => {
  try {
    if (isFavorite(eventId)) {
      await eventApi.removeFavorite(eventId);
      favorites.value = favorites.value.filter(id => id !== eventId);
    } else {
      await eventApi.addFavorite(eventId);
      favorites.value.push(eventId);
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
};

const loadEvents = async () => {
  try {
    events.value = await eventApi.getEvents();
    const favs = await eventApi.getFavorites();
    favorites.value = favs.map(f => f.event_id);
  } catch (error) {
    console.error('加载活动失败:', error);
  }
};

onMounted(() => {
  loadEvents();
});

watch(() => route.path, () => {
  loadEvents();
});
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero-section {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  margin-bottom: 2rem;
}

.hero-section h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero-section p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.events-section {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  color: #333;
}

.filter-bar {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.filter-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}
</style>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <router-link to="/" class="navbar-brand">
        🎉 校园活动平台
      </router-link>
      
      <div class="navbar-menu">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/events/create" class="nav-link">发布活动</router-link>
        <router-link to="/my-events" class="nav-link">我的活动</router-link>
        <router-link to="/my-registrations" class="nav-link">我的报名</router-link>
        <router-link to="/my-favorites" class="nav-link">我的收藏</router-link>
        <router-link to="/ai-assistant" class="nav-link ai-link">🤖 AI助手</router-link>
      </div>

      <div class="navbar-user">
        <router-link to="/profile" class="nav-link user-profile">
          👤 {{ userStore.user?.username || '个人中心' }}
        </router-link>
        <button @click="handleLogout" class="logout-btn">
          退出登录
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const handleLogout = async () => {
  await userStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-decoration: none;
}

.navbar-menu {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.ai-link {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 8px;
  padding: 0.5rem 1rem;
}

.nav-link.ai-link:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logout-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>

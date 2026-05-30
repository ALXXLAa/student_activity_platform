import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useUserStore } from '../stores/user';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../components/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../components/Register.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../components/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/events/create',
    name: 'CreateEvent',
    component: () => import('../components/CreateEvent.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/events/:id/edit',
    name: 'EditEvent',
    component: () => import('../components/EditEvent.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/events/:id',
    name: 'EventDetail',
    component: () => import('../components/EventDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-events',
    name: 'MyEvents',
    component: () => import('../components/MyEvents.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-registrations',
    name: 'MyRegistrations',
    component: () => import('../components/MyRegistrations.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-favorites',
    name: 'MyFavorites',
    component: () => import('../components/MyFavorites.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ai-assistant',
    name: 'AiAssistant',
    component: () => import('../components/AiAssistant.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn) {
    next('/');
  } else {
    next();
  }
});

export default router;

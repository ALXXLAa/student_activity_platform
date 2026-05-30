import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import { useUserStore } from './stores/user';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// 初始化用户状态
const userStore = useUserStore();
userStore.initializeFromStorage();

app.mount('#app');

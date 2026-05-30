<template>
    <div class="login-container">
        <div class="login-card">
            <h2 class="login-title">登录</h2>
            <form @submit.prevent="handleSubmit" class="login-form">
                <div class="form-group">
                    <label for="email">邮箱</label>
                    <input id="email" v-model="formData.email" type="email" placeholder="请输入邮箱" required
                        :class="{ 'error': errors.email }" />
                    <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
                </div>

                <div class="form-group">
                    <label for="password">密码</label>
                    <input id="password" v-model="formData.password" type="password" placeholder="请输入密码" required
                        :class="{ 'error': errors.password }" />
                    <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
                </div>

                <div class="form-options">
                    <label class="remember-me">
                        <input v-model="formData.rememberMe" type="checkbox" />
                        <span>记住我</span>
                    </label>
                    <router-link to="/forgot-password" class="forgot-password">
                        忘记密码？
                    </router-link>
                </div>

                <button type="submit" class="submit-button" :disabled="isLoading">
                    {{ isLoading ? '登录中...' : '登录' }}
                </button>

                <div v-if="userStore.error" class="error-alert">
                    {{ userStore.error }}
                </div>
            </form>

            <div class="register-link">
                还没有账号？<router-link to="/register">立即注册</router-link>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const formData = reactive({
    email: '',
    password: '',
    rememberMe: false
});

const errors = reactive({
    email: '',
    password: ''
});

const isLoading = ref(false);

const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateForm = (): boolean => {
    let isValid = true;

    errors.email = '';
    errors.password = '';

    if (!validateEmail(formData.email)) {
        errors.email = '请输入有效的邮箱地址';
        isValid = false;
    }

    if (formData.password.length < 6) {
        errors.password = '密码至少需要6个字符';
        isValid = false;
    }

    return isValid;
};

const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    isLoading.value = true;
    try {
        await userStore.login(formData.email, formData.password);

        if (formData.rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('rememberMe');
        }

        router.push('/');
    } catch (error) {
        console.error('登录失败:', error);
    } finally {
        isLoading.value = false;
    }
};

const checkRememberMe = () => {
    if (localStorage.getItem('rememberMe') === 'true') {
        formData.rememberMe = true;
    }
};

checkRememberMe();
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.login-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    padding: 40px;
    width: 100%;
    max-width: 420px;
}

.login-title {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    text-align: center;
    margin-bottom: 30px;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-size: 14px;
    font-weight: 500;
    color: #555;
}

.form-group input {
    padding: 12px 16px;
    border: 2px solid #e1e8ed;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
}

.form-group input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input.error {
    border-color: #ef4444;
}

.error-message {
    font-size: 12px;
    color: #ef4444;
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 5px 0;
}

.remember-me {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #666;
    cursor: pointer;
}

.remember-me input[type="checkbox"] {
    cursor: pointer;
}

.forgot-password {
    font-size: 14px;
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
}

.forgot-password:hover {
    text-decoration: underline;
}

.submit-button {
    padding: 14px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 10px;
}

.submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.error-alert {
    padding: 12px 16px;
    background-color: #fee2e2;
    color: #dc2626;
    border-radius: 8px;
    font-size: 14px;
    margin-top: 10px;
}

.register-link {
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
    color: #666;
}

.register-link a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
}

.register-link a:hover {
    text-decoration: underline;
}
</style>

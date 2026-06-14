<template>
    <div class="register-container">
        <div class="register-card">
            <h2 class="register-title">注册账号</h2>
            <form @submit.prevent="handleSubmit" class="register-form">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input id="username" v-model="formData.username" type="text" placeholder="请输入用户名" required
                        :class="{ 'error': errors.username }" />
                    <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
                </div>

                <div class="form-group">
                    <label for="email">邮箱</label>
                    <input id="email" v-model="formData.email" type="email" placeholder="请输入邮箱" required
                        :class="{ 'error': errors.email }" />
                    <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
                </div>

                <div class="form-group">
                    <label for="password">密码</label>
                    <input id="password" v-model="formData.password" type="password" placeholder="请输入密码（至少6位）" required
                        :class="{ 'error': errors.password || passwordLengthError }" @input="validatePasswordLength" />
                    <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
                    <span v-if="passwordLengthError" class="error-message">{{ passwordLengthError }}</span>
                </div>

                <div class="form-group">
                    <label for="confirmPassword">确认密码</label>
                    <input id="confirmPassword" v-model="formData.confirmPassword" type="password" placeholder="请再次输入密码"
                        required :class="{ 'error': errors.confirmPassword || confirmPasswordLengthError }"
                        @input="validateConfirmPasswordLength" />
                    <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
                    <span v-if="confirmPasswordLengthError" class="error-message">{{ confirmPasswordLengthError
                    }}</span>
                </div>

                <div class="form-group">
                    <label for="phone">手机号</label>
                    <input id="phone" v-model="formData.phone" type="tel" placeholder="请输入手机号" required
                        :class="{ 'error': errors.phone }" />
                    <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
                </div>

                <div class="form-group">
                    <label for="studentId">学号</label>
                    <input id="studentId" v-model="formData.studentId" type="text" placeholder="请输入学号" required
                        :class="{ 'error': errors.studentId }" />
                    <span v-if="errors.studentId" class="error-message">{{ errors.studentId }}</span>
                </div>

                <div class="form-group">
                    <label for="major">专业</label>
                    <input id="major" v-model="formData.major" type="text" placeholder="请输入专业" required
                        :class="{ 'error': errors.major }" />
                    <span v-if="errors.major" class="error-message">{{ errors.major }}</span>
                </div>

                <div class="form-group">
                    <label for="grade">年级</label>
                    <select id="grade" v-model="formData.grade" :class="{ 'error': errors.grade }">
                        <option value="">请选择年级</option>
                        <option value="大一">大一</option>
                        <option value="大二">大二</option>
                        <option value="大三">大三</option>
                        <option value="大四">大四</option>
                        <option value="研究生">研究生</option>
                        <option value="博士">博士</option>
                    </select>
                    <span v-if="errors.grade" class="error-message">{{ errors.grade }}</span>
                </div>

                <button type="submit" class="submit-button" :disabled="isLoading || !isSubmitEnabled">
                    {{ isLoading ? '注册中...' : '注册' }}
                </button>

                <div v-if="userStore.error" class="error-alert">
                    {{ userStore.error }}
                </div>
            </form>

            <div class="login-link">
                已有账号？<router-link to="/login">立即登录</router-link>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const formData = reactive({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    studentId: '',
    major: '',
    grade: ''
});

const errors = reactive({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    studentId: '',
    major: '',
    grade: ''
});

const isLoading = ref(false);
const passwordLengthError = ref('');
const confirmPasswordLengthError = ref('');

const isSubmitEnabled = computed(() => {
    return formData.password.length >= 6 && formData.confirmPassword.length >= 6;
});

const validatePasswordLength = () => {
    if (formData.password.length > 0 && formData.password.length < 6) {
        passwordLengthError.value = '你的密码长度小于6位';
    } else {
        passwordLengthError.value = '';
    }
};

const validateConfirmPasswordLength = () => {
    if (formData.confirmPassword.length > 0 && formData.confirmPassword.length < 6) {
        confirmPasswordLengthError.value = '你的密码长度小于6位';
    } else {
        confirmPasswordLengthError.value = '';
    }
};

const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
};

const validateForm = (): boolean => {
    let isValid = true;

    errors.username = '';
    errors.email = '';
    errors.password = '';
    errors.confirmPassword = '';
    errors.phone = '';
    errors.studentId = '';
    errors.major = '';
    errors.grade = '';

    if (formData.username.length < 2) {
        errors.username = '用户名至少需要2个字符';
        isValid = false;
    }

    if (!validateEmail(formData.email)) {
        errors.email = '请输入有效的邮箱地址';
        isValid = false;
    }

    if (formData.password.length < 6) {
        errors.password = '密码至少需要6个字符';
        isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = '两次输入的密码不一致';
        isValid = false;
    }

    if (!formData.phone) {
        errors.phone = '请输入手机号';
        isValid = false;
    } else if (!validatePhone(formData.phone)) {
        errors.phone = '请输入有效的手机号';
        isValid = false;
    }

    if (!formData.studentId) {
        errors.studentId = '请输入学号';
        isValid = false;
    }

    if (!formData.major) {
        errors.major = '请输入专业';
        isValid = false;
    }

    if (!formData.grade) {
        errors.grade = '请选择年级';
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
        await userStore.register(
            formData.username,
            formData.email,
            formData.password,
            {
                phone: formData.phone || undefined,
                studentId: formData.studentId || undefined,
                major: formData.major || undefined,
                grade: formData.grade || undefined
            }
        );
        router.push('/');
    } catch (error) {
        console.error('注册失败:', error);
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
.register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.register-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    padding: 40px;
    width: 100%;
    max-width: 480px;
}

.register-title {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    text-align: center;
    margin-bottom: 30px;
}

.register-form {
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

.form-group input,
.form-group select {
    padding: 12px 16px;
    border: 2px solid #e1e8ed;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
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

.login-link {
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
    color: #666;
}

.login-link a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
}

.login-link a:hover {
    text-decoration: underline;
}
</style>

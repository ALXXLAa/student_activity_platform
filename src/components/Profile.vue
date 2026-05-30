<template>
    <div class="profile-container">
        <div class="profile-header">
            <h1>个人信息</h1>
        </div>

        <div class="profile-content">
            <div class="avatar-section">
                <div class="avatar-wrapper">
                    <img :src="userStore.user?.avatar || defaultAvatar" alt="头像" class="avatar" />
                    <label class="avatar-upload">
                        <input type="file" accept="image/*" @change="handleAvatarUpload"
                            :disabled="isUploadingAvatar" />
                        <span v-if="isUploadingAvatar">上传中...</span>
                        <span v-else>更换头像</span>
                    </label>
                </div>
            </div>

            <div class="info-section">
                <div class="info-card">
                    <h3>基本信息</h3>
                    <form @submit.prevent="handleUpdateProfile" class="profile-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>用户名</label>
                                <input v-model="profileData.username" type="text" placeholder="请输入用户名"
                                    :disabled="!isEditing" :class="{ 'disabled': !isEditing }" />
                            </div>

                            <div class="form-group">
                                <label>邮箱</label>
                                <input :value="userStore.user?.email" type="email" disabled class="disabled" />
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>手机号</label>
                                <input v-model="profileData.phone" type="tel" placeholder="请输入手机号"
                                    :disabled="!isEditing" :class="{ 'disabled': !isEditing }" />
                            </div>

                            <div class="form-group">
                                <label>学号</label>
                                <input v-model="profileData.studentId" type="text" placeholder="请输入学号"
                                    :disabled="!isEditing" :class="{ 'disabled': !isEditing }" />
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>专业</label>
                                <input v-model="profileData.major" type="text" placeholder="请输入专业"
                                    :disabled="!isEditing" :class="{ 'disabled': !isEditing }" />
                            </div>

                            <div class="form-group">
                                <label>年级</label>
                                <select v-model="profileData.grade" :disabled="!isEditing"
                                    :class="{ 'disabled': !isEditing }">
                                    <option value="">请选择年级</option>
                                    <option value="大一">大一</option>
                                    <option value="大二">大二</option>
                                    <option value="大三">大三</option>
                                    <option value="大四">大四</option>
                                    <option value="研究生">研究生</option>
                                    <option value="博士">博士</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>个人简介</label>
                            <textarea v-model="profileData.bio" placeholder="介绍一下自己..." rows="4" :disabled="!isEditing"
                                :class="{ 'disabled': !isEditing }"></textarea>
                        </div>

                        <div class="form-actions">
                            <button v-if="!isEditing" type="button" @click="startEditing" class="edit-button">
                                编辑信息
                            </button>
                            <template v-else>
                                <button type="button" @click="cancelEditing" class="cancel-button">
                                    取消
                                </button>
                                <button type="submit" class="save-button" :disabled="isLoading">
                                    {{ isLoading ? '保存中...' : '保存' }}
                                </button>
                            </template>
                        </div>
                    </form>
                </div>

                <div class="info-card">
                    <h3>修改密码</h3>
                    <form @submit.prevent="handleChangePassword" class="password-form">
                        <div class="form-group">
                            <label>当前密码</label>
                            <input v-model="passwordData.oldPassword" type="password" placeholder="请输入当前密码" required />
                        </div>

                        <div class="form-group">
                            <label>新密码</label>
                            <input v-model="passwordData.newPassword" type="password" placeholder="请输入新密码（至少6位）"
                                required />
                        </div>

                        <div class="form-group">
                            <label>确认新密码</label>
                            <input v-model="passwordData.confirmPassword" type="password" placeholder="请再次输入新密码"
                                required />
                        </div>

                        <div v-if="passwordError" class="error-alert">
                            {{ passwordError }}
                        </div>

                        <button type="submit" class="submit-button" :disabled="isChangingPassword">
                            {{ isChangingPassword ? '修改中...' : '修改密码' }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '../stores/user';
import * as userApi from '../api/user';

const userStore = useUserStore();

const defaultAvatar = 'https://via.placeholder.com/150';
const isEditing = ref(false);
const isLoading = ref(false);
const isUploadingAvatar = ref(false);
const isChangingPassword = ref(false);
const passwordError = ref('');

const profileData = reactive({
    username: '',
    phone: '',
    studentId: '',
    major: '',
    grade: '',
    bio: ''
});

const passwordData = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const originalProfileData = reactive({
    username: '',
    phone: '',
    studentId: '',
    major: '',
    grade: '',
    bio: ''
});

const loadUserData = () => {
    if (userStore.user) {
        profileData.username = userStore.user.username;
        profileData.phone = userStore.user.phone || '';
        profileData.studentId = userStore.user.studentId || '';
        profileData.major = userStore.user.major || '';
        profileData.grade = userStore.user.grade || '';
        profileData.bio = userStore.user.bio || '';

        originalProfileData.username = userStore.user.username;
        originalProfileData.phone = userStore.user.phone || '';
        originalProfileData.studentId = userStore.user.studentId || '';
        originalProfileData.major = userStore.user.major || '';
        originalProfileData.grade = userStore.user.grade || '';
        originalProfileData.bio = userStore.user.bio || '';
    }
};

const startEditing = () => {
    isEditing.value = true;
};

const cancelEditing = () => {
    profileData.username = originalProfileData.username;
    profileData.phone = originalProfileData.phone;
    profileData.studentId = originalProfileData.studentId;
    profileData.major = originalProfileData.major;
    profileData.grade = originalProfileData.grade;
    profileData.bio = originalProfileData.bio;
    isEditing.value = false;
};

const handleUpdateProfile = async () => {
    isLoading.value = true;
    try {
        await userStore.updateProfile(profileData);
        isEditing.value = false;
        Object.assign(originalProfileData, profileData);
    } catch (error) {
        console.error('更新个人信息失败:', error);
    } finally {
        isLoading.value = false;
    }
};

const handleAvatarUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
    }

    isUploadingAvatar.value = true;
    try {
        const result = await userApi.uploadAvatar(file);
        await userStore.updateProfile({ avatar: result.avatarUrl });
    } catch (error) {
        console.error('上传头像失败:', error);
        alert('上传头像失败，请重试');
    } finally {
        isUploadingAvatar.value = false;
    }
};

const handleChangePassword = async () => {
    passwordError.value = '';

    if (passwordData.newPassword.length < 6) {
        passwordError.value = '新密码至少需要6个字符';
        return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
        passwordError.value = '两次输入的密码不一致';
        return;
    }

    isChangingPassword.value = true;
    try {
        await userStore.changePassword(passwordData.oldPassword, passwordData.newPassword);
        alert('密码修改成功');
        passwordData.oldPassword = '';
        passwordData.newPassword = '';
        passwordData.confirmPassword = '';
    } catch (error: any) {
        console.error('修改密码失败:', error);
        passwordError.value = error.message || '修改密码失败';
    } finally {
        isChangingPassword.value = false;
    }
};

onMounted(() => {
    loadUserData();
});
</script>

<style scoped>
.profile-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
}

.profile-header {
    margin-bottom: 30px;
}

.profile-header h1 {
    font-size: 32px;
    font-weight: 600;
    color: #333;
}

.profile-content {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 30px;
}

.avatar-section {
    position: sticky;
    top: 20px;
    height: fit-content;
}

.avatar-wrapper {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    padding: 30px;
    text-align: center;
}

.avatar {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 20px;
    border: 3px solid #667eea;
}

.avatar-upload {
    display: inline-block;
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.avatar-upload:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.avatar-upload input[type="file"] {
    display: none;
}

.info-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.info-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    padding: 30px;
}

.info-card h3 {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f0f0f0;
}

.profile-form,
.password-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
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
.form-group select,
.form-group textarea {
    padding: 12px 16px;
    border: 2px solid #e1e8ed;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
    font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input.disabled,
.form-group select.disabled,
.form-group textarea.disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
}

.form-group textarea {
    resize: vertical;
    min-height: 100px;
}

.form-actions {
    display: flex;
    gap: 12px;
    margin-top: 10px;
}

.edit-button,
.cancel-button,
.save-button,
.submit-button {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.edit-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.edit-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.cancel-button {
    background: #f3f4f6;
    color: #6b7280;
}

.cancel-button:hover {
    background: #e5e7eb;
}

.save-button,
.submit-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.save-button:hover:not(:disabled),
.submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.save-button:disabled,
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
}

@media (max-width: 768px) {
    .profile-content {
        grid-template-columns: 1fr;
    }

    .avatar-section {
        position: static;
    }

    .form-row {
        grid-template-columns: 1fr;
    }
}
</style>

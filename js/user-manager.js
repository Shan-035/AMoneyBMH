// 用戶管理模組
class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
    }

    // 載入用戶資料
    loadUsers() {
        const users = localStorage.getItem('portfolio_users');
        return users ? JSON.parse(users) : {};
    }

    // 儲存用戶資料
    saveUsers() {
        localStorage.setItem('portfolio_users', JSON.stringify(this.users));
    }

    // 建立新用戶
    createUser(username, password, config = {}) {
        if (this.users[username]) {
            throw new Error('用戶名稱已存在');
        }

        const userId = this.generateUserId();
        this.users[username] = {
            id: userId,
            username: username,
            passwordHash: this.hashPassword(password),
            config: {
                googleSheetsUrl: config.googleSheetsUrl || '',
                apiKeys: config.apiKeys || {},
                settings: config.settings || {}
            },
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        this.saveUsers();
        return userId;
    }

    // 用戶登入
    login(username, password) {
        const user = this.users[username];
        if (!user || !this.verifyPassword(password, user.passwordHash)) {
            throw new Error('用戶名稱或密碼錯誤');
        }

        this.currentUser = user;
        user.lastLogin = new Date().toISOString();
        this.saveUsers();

        // 設定用戶專用的儲存前綴
        this.setUserStoragePrefix(user.id);
        
        return user;
    }

    // 用戶登出
    logout() {
        this.currentUser = null;
        this.clearUserStoragePrefix();
    }

    // 檢查是否已登入
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 取得當前用戶
    getCurrentUser() {
        return this.currentUser;
    }

    // 設定用戶專用的儲存前綴
    setUserStoragePrefix(userId) {
        window.userStoragePrefix = `user_${userId}_`;
    }

    // 清除用戶儲存前綴
    clearUserStoragePrefix() {
        window.userStoragePrefix = '';
    }

    // 用戶專用的 localStorage 操作
    getUserItem(key) {
        const prefix = window.userStoragePrefix || '';
        return localStorage.getItem(prefix + key);
    }

    setUserItem(key, value) {
        const prefix = window.userStoragePrefix || '';
        localStorage.setItem(prefix + key, value);
    }

    removeUserItem(key) {
        const prefix = window.userStoragePrefix || '';
        localStorage.removeItem(prefix + key);
    }

    // 生成用戶 ID
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 簡單密碼雜湊
    hashPassword(password) {
        // 注意：這是簡單的雜湊方式，不適合真正的生產環境
        let hash = 0;
        if (password.length === 0) return hash;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 轉換為 32 位整數
        }
        return hash.toString();
    }

    // 驗證密碼
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    // 更新用戶配置
    updateUserConfig(config) {
        if (!this.currentUser) {
            throw new Error('用戶未登入');
        }

        this.users[this.currentUser.username].config = {
            ...this.users[this.currentUser.username].config,
            ...config
        };

        this.currentUser.config = this.users[this.currentUser.username].config;
        this.saveUsers();
    }

    // 取得用戶配置
    getUserConfig() {
        if (!this.currentUser) {
            return null;
        }
        return this.currentUser.config;
    }

    // 刪除用戶
    deleteUser(username, password) {
        const user = this.users[username];
        if (!user || !this.verifyPassword(password, user.passwordHash)) {
            throw new Error('用戶名稱或密碼錯誤');
        }

        // 清理用戶資料
        this.clearUserData(user.id);
        delete this.users[username];
        this.saveUsers();

        if (this.currentUser && this.currentUser.username === username) {
            this.logout();
        }
    }

    // 清理用戶資料
    clearUserData(userId) {
        const prefix = `user_${userId}_`;
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    // 匯出用戶資料
    exportUserData() {
        if (!this.currentUser) {
            throw new Error('用戶未登入');
        }

        const prefix = window.userStoragePrefix;
        const userData = {};
        const keys = Object.keys(localStorage);

        keys.forEach(key => {
            if (key.startsWith(prefix)) {
                const cleanKey = key.replace(prefix, '');
                userData[cleanKey] = localStorage.getItem(key);
            }
        });

        return {
            user: this.currentUser,
            data: userData,
            exportDate: new Date().toISOString()
        };
    }

    // 匯入用戶資料
    importUserData(exportData) {
        if (!this.currentUser) {
            throw new Error('用戶未登入');
        }

        const prefix = window.userStoragePrefix;
        Object.entries(exportData.data).forEach(([key, value]) => {
            localStorage.setItem(prefix + key, value);
        });
    }
}

// 導出給全域使用
window.UserManager = UserManager;
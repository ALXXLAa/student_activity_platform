import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
dotenv.config();
//这是一次对提交名的测试
const app = express();
const port = 3006;

app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3003'],
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件（jpeg, jpg, png, gif）'));
    }
  }
});

let db;

const initDatabase = async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME || 'campus_event_platform'
    });
    
    console.log('数据库连接成功');
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        student_id VARCHAR(20),
        major VARCHAR(100),
        grade VARCHAR(20),
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    try {
      await db.execute(`ALTER TABLE users ADD COLUMN avatar VARCHAR(255);`);
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') {
        console.log('添加 avatar 字段时出现错误:', e.message);
      }
    }
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        location VARCHAR(200),
        organizer VARCHAR(100),
        max_participants INT DEFAULT 100,
        status VARCHAR(20) DEFAULT 'pending',
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE KEY unique_registration (event_id, user_id)
      );
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE KEY unique_favorite (event_id, user_id)
      );
    `);
    
    console.log('数据库表初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
};

initDatabase();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('verifyToken - 请求头:', { authorization: req.headers.authorization, token });
  
  if (!token) {
    return res.status(401).json({ message: '未提供token' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('verifyToken - 解码结果:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: '无效的token' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, phone, studentId, major, grade } = req.body;
  
  try {
    const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, phone, student_id, major, grade) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, phone, studentId, major, grade]
    );
    
    const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    
    const [users] = await db.execute('SELECT id, username, email, phone, student_id as studentId, major, grade, created_at, updated_at FROM users WHERE id = ?', [result.insertId]);
    
    res.json({ user: users[0], token });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '注册失败' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    
    const user = users[0];
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      studentId: user.student_id,
      major: user.major,
      grade: user.grade,
      avatar: user.avatar,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
    
    res.json({ user: userInfo, token });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: '登出成功' });
});

app.get('/api/user/me', verifyToken, async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, username, email, phone, student_id as studentId, major, grade, avatar, created_at, updated_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

app.put('/api/user/profile', verifyToken, async (req, res) => {
  const { username, phone, studentId, major, grade, avatar } = req.body;
  
  try {
    const updateFields = [];
    const updateValues = [];
    
    if (username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (studentId !== undefined) {
      updateFields.push('student_id = ?');
      updateValues.push(studentId);
    }
    if (major !== undefined) {
      updateFields.push('major = ?');
      updateValues.push(major);
    }
    if (grade !== undefined) {
      updateFields.push('grade = ?');
      updateValues.push(grade);
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      updateValues.push(avatar);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: '没有提供要更新的字段' });
    }
    
    updateValues.push(req.user.id);
    
    await db.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    const [users] = await db.execute('SELECT id, username, email, phone, student_id as studentId, major, grade, avatar, created_at, updated_at FROM users WHERE id = ?', [req.user.id]);
    
    res.json(users[0]);
  } catch (error) {
    console.error('更新个人信息失败:', error);
    res.status(500).json({ message: '更新个人信息失败' });
  }
});

app.put('/api/user/password', verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  try {
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    const user = users[0];
    
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '旧密码错误' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
    
    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ message: '修改密码失败' });
  }
});

app.post('/api/user/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未选择文件' });
    }
    
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    await db.execute('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);
    
    res.json({ avatarUrl });
  } catch (error) {
    console.error('上传头像失败:', error);
    res.status(500).json({ message: '上传头像失败' });
  }
});

// 获取所有活动
app.get('/api/events', async (req, res) => {
  try {
    const [events] = await db.execute(
      'SELECT e.*, u.username FROM events e LEFT JOIN users u ON e.created_by = u.id ORDER BY e.created_at DESC'
    );
    res.json(events);
  } catch (error) {
    console.error('获取活动列表失败:', error);
    res.status(500).json({ message: '获取活动列表失败' });
  }
});

// 获取当前用户创建的活动
app.get('/api/events/my', verifyToken, async (req, res) => {
  try {
    // 将用户ID转换为数字进行查询
    const userId = parseInt(req.user.id);
    console.log('获取我的活动 - 用户ID:', { original: req.user.id, parsed: userId, type: typeof userId });
    
    const [events] = await db.execute(
      'SELECT e.*, u.username FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE e.created_by = ? ORDER BY e.created_at DESC',
      [userId]
    );
    
    console.log('查询结果 - 活动数量:', events.length);
    console.log('查询结果 - 活动列表:', JSON.stringify(events));
    
    res.json(events);
  } catch (error) {
    console.error('获取我的活动失败:', error);
    res.status(500).json({ message: '获取我的活动失败' });
  }
});

// 获取单个活动详情
app.get('/api/events/:id', async (req, res) => {
  const eventId = req.params.id;
  try {
    const [events] = await db.execute(
      'SELECT e.*, u.username FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?',
      [eventId]
    );
    if (events.length === 0) {
      return res.status(404).json({ message: '活动不存在' });
    }
    res.json(events[0]);
  } catch (error) {
    console.error('获取活动详情失败:', error);
    res.status(500).json({ message: '获取活动详情失败' });
  }
});

// 创建活动
app.post('/api/events', verifyToken, async (req, res) => {
  const { title, description, start_time, end_time, location, organizer, max_participants } = req.body;
  
  try {
    const [result] = await db.execute(
      'INSERT INTO events (title, description, start_time, end_time, location, organizer, max_participants, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, start_time, end_time, location, organizer, max_participants, 'pending', req.user.id]
    );
    
    const [events] = await db.execute(
      'SELECT e.*, u.username FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?',
      [result.insertId]
    );
    
    res.json(events[0]);
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({ message: '创建活动失败' });
  }
});

// 更新活动
app.put('/api/events/:id', verifyToken, async (req, res) => {
  const eventId = req.params.id;
  const { title, description, start_time, end_time, location, organizer, max_participants } = req.body;
  
  try {
    const [events] = await db.execute('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    // 将用户ID转换为数字进行比较
    const userId = parseInt(req.user.id);
    if (events[0].created_by !== userId) {
      return res.status(403).json({ message: '无权修改此活动' });
    }
    
    await db.execute(
      'UPDATE events SET title = ?, description = ?, start_time = ?, end_time = ?, location = ?, organizer = ?, max_participants = ? WHERE id = ?',
      [title, description, start_time, end_time, location, organizer, max_participants, eventId]
    );
    
    const [updatedEvents] = await db.execute(
      'SELECT e.*, u.username FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?',
      [eventId]
    );
    
    res.json(updatedEvents[0]);
  } catch (error) {
    console.error('更新活动失败:', error);
    res.status(500).json({ message: '更新活动失败' });
  }
});

// 删除活动
app.delete('/api/events/:id', verifyToken, async (req, res) => {
  const eventId = parseInt(req.params.id);
  
  if (isNaN(eventId)) {
    return res.status(400).json({ message: '无效的活动ID' });
  }
  
  try {
    const [events] = await db.execute('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    // 将用户ID转换为数字进行比较
    const userId = parseInt(req.user.id);
    if (events[0].created_by !== userId) {
      return res.status(403).json({ message: '无权删除此活动' });
    }
    
    await db.execute('SET FOREIGN_KEY_CHECKS=0');
    await db.execute('DELETE FROM favorites WHERE event_id = ?', [eventId]);
    await db.execute('DELETE FROM comments WHERE event_id = ?', [eventId]);
    await db.execute('DELETE FROM registrations WHERE event_id = ?', [eventId]);
    await db.execute('DELETE FROM events WHERE id = ?', [eventId]);
    await db.execute('SET FOREIGN_KEY_CHECKS=1');
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除活动失败:', error);
    res.status(500).json({ message: '删除活动失败' });
  }
});

// 审核活动（更新状态）
app.put('/api/events/:id/status', verifyToken, async (req, res) => {
  const eventId = parseInt(req.params.id);
  const { status } = req.body;
  
  if (isNaN(eventId)) {
    return res.status(400).json({ message: '无效的活动ID' });
  }
  
  if (!['active', 'pending', 'completed'].includes(status)) {
    return res.status(400).json({ message: '无效的状态值' });
  }
  
  try {
    const [events] = await db.execute('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    // 将用户ID转换为数字进行比较
    const userId = parseInt(req.user.id);
    if (events[0].created_by !== userId) {
      console.log('用户ID不匹配:', { created_by: events[0].created_by, user_id: userId, req_user_id: req.user.id });
      return res.status(403).json({ message: '无权修改此活动状态' });
    }
    
    await db.execute('UPDATE events SET status = ? WHERE id = ?', [status, eventId]);
    
    const [updatedEvents] = await db.execute(
      'SELECT e.*, u.username FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?',
      [eventId]
    );
    
    res.json(updatedEvents[0]);
  } catch (error) {
    console.error('更新活动状态失败:', error);
    res.status(500).json({ message: '更新活动状态失败' });
  }
});



// 报名活动
app.post('/api/events/:id/register', verifyToken, async (req, res) => {
  const eventId = req.params.id;
  
  try {
    const [events] = await db.execute('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    if (events[0].status !== 'active') {
      return res.status(400).json({ message: '活动未开始报名' });
    }
    
    const [registrations] = await db.execute(
      'SELECT * FROM registrations WHERE event_id = ? AND user_id = ?',
      [eventId, req.user.id]
    );
    if (registrations.length > 0) {
      return res.status(400).json({ message: '您已报名此活动' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO registrations (event_id, user_id, status) VALUES (?, ?, ?)',
      [eventId, req.user.id, 'pending']
    );
    
    res.json({ id: result.insertId, event_id: eventId, user_id: req.user.id, status: 'pending' });
  } catch (error) {
    console.error('报名失败:', error);
    res.status(500).json({ message: '报名失败' });
  }
});

// 获取活动报名列表
app.get('/api/events/:id/registrations', verifyToken, async (req, res) => {
  const eventId = req.params.id;
  
  try {
    const [events] = await db.execute('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    // 将用户ID转换为数字进行比较
    const userId = parseInt(req.user.id);
    if (events[0].created_by !== userId) {
      return res.status(403).json({ message: '无权查看此活动的报名列表' });
    }
    
    const [registrations] = await db.execute(
      'SELECT r.*, u.username FROM registrations r LEFT JOIN users u ON r.user_id = u.id WHERE r.event_id = ? ORDER BY r.created_at DESC',
      [eventId]
    );
    
    res.json(registrations);
  } catch (error) {
    console.error('获取报名列表失败:', error);
    res.status(500).json({ message: '获取报名列表失败' });
  }
});

// 获取当前用户的报名记录
app.get('/api/registrations/my', verifyToken, async (req, res) => {
  try {
    const [registrations] = await db.execute(
      'SELECT r.*, e.title, e.start_time, e.location FROM registrations r LEFT JOIN events e ON r.event_id = e.id WHERE r.user_id = ? ORDER BY r.created_at DESC',
      [req.user.id]
    );
    
    const result = registrations.map(r => ({
      ...r,
      event: {
        id: r.event_id,
        title: r.title,
        start_time: r.start_time,
        location: r.location
      }
    }));
    
    res.json(result);
  } catch (error) {
    console.error('获取我的报名失败:', error);
    res.status(500).json({ message: '获取我的报名失败' });
  }
});

// 更新报名状态
app.put('/api/registrations/:id', verifyToken, async (req, res) => {
  const registrationId = req.params.id;
  const { status } = req.body;
  
  try {
    const [registrations] = await db.execute('SELECT * FROM registrations WHERE id = ?', [registrationId]);
    if (registrations.length === 0) {
      return res.status(404).json({ message: '报名记录不存在' });
    }
    
    const [events] = await db.execute('SELECT * FROM events WHERE id = ?', [registrations[0].event_id]);
    // 将用户ID转换为数字进行比较
    const userId = parseInt(req.user.id);
    if (events[0].created_by !== userId) {
      return res.status(403).json({ message: '无权修改此报名状态' });
    }
    
    await db.execute('UPDATE registrations SET status = ? WHERE id = ?', [status, registrationId]);
    
    const [updatedRegistrations] = await db.execute(
      'SELECT r.*, u.username FROM registrations r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?',
      [registrationId]
    );
    
    res.json(updatedRegistrations[0]);
  } catch (error) {
    console.error('更新报名状态失败:', error);
    res.status(500).json({ message: '更新报名状态失败' });
  }
});

// 取消报名
app.delete('/api/registrations/:id', verifyToken, async (req, res) => {
  const registrationId = req.params.id;
  
  try {
    const [registrations] = await db.execute('SELECT * FROM registrations WHERE id = ?', [registrationId]);
    if (registrations.length === 0) {
      return res.status(404).json({ message: '报名记录不存在' });
    }
    
    // 将用户ID转换为数字进行比较
    const userId = parseInt(req.user.id);
    if (registrations[0].user_id !== userId) {
      return res.status(403).json({ message: '无权取消此报名' });
    }
    
    await db.execute('DELETE FROM registrations WHERE id = ?', [registrationId]);
    
    res.json({ message: '取消报名成功' });
  } catch (error) {
    console.error('取消报名失败:', error);
    res.status(500).json({ message: '取消报名失败' });
  }
});

// 添加收藏
app.post('/api/events/:id/favorite', verifyToken, async (req, res) => {
  const eventId = req.params.id;
  
  try {
    const [events] = await db.execute('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    const [favorites] = await db.execute(
      'SELECT * FROM favorites WHERE event_id = ? AND user_id = ?',
      [eventId, req.user.id]
    );
    if (favorites.length > 0) {
      return res.status(400).json({ message: '您已收藏此活动' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO favorites (event_id, user_id) VALUES (?, ?)',
      [eventId, req.user.id]
    );
    
    res.json({ id: result.insertId, event_id: eventId, user_id: req.user.id });
  } catch (error) {
    console.error('添加收藏失败:', error);
    res.status(500).json({ message: '添加收藏失败' });
  }
});

// 取消收藏
app.delete('/api/events/:id/favorite', verifyToken, async (req, res) => {
  const eventId = parseInt(req.params.id);
  
  if (isNaN(eventId)) {
    return res.status(400).json({ message: '无效的活动ID' });
  }
  
  try {
    await db.execute('DELETE FROM favorites WHERE event_id = ? AND user_id = ?', [eventId, req.user.id]);
    res.json({ message: '取消收藏成功' });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({ message: '取消收藏失败' });
  }
});

// 检查是否收藏
app.get('/api/events/:id/favorite/check', verifyToken, async (req, res) => {
  const eventId = req.params.id;
  
  try {
    const [favorites] = await db.execute(
      'SELECT * FROM favorites WHERE event_id = ? AND user_id = ?',
      [eventId, req.user.id]
    );
    res.json({ isFavorite: favorites.length > 0 });
  } catch (error) {
    console.error('检查收藏失败:', error);
    res.status(500).json({ message: '检查收藏失败' });
  }
});

// 获取我的收藏
app.get('/api/favorites/my', verifyToken, async (req, res) => {
  try {
    const [favorites] = await db.execute(
      'SELECT f.*, e.title, e.start_time, e.location, e.status FROM favorites f LEFT JOIN events e ON f.event_id = e.id WHERE f.user_id = ? ORDER BY f.created_at DESC',
      [req.user.id]
    );
    
    const result = favorites.map(f => ({
      ...f,
      event: {
        id: f.event_id,
        title: f.title,
        start_time: f.start_time,
        location: f.location,
        status: f.status
      }
    }));
    
    res.json(result);
  } catch (error) {
    console.error('获取我的收藏失败:', error);
    res.status(500).json({ message: '获取我的收藏失败' });
  }
});

// 获取活动评论
app.get('/api/events/:id/comments', async (req, res) => {
  const eventId = req.params.id;
  
  try {
    const [comments] = await db.execute(
      'SELECT c.*, u.username FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.event_id = ? ORDER BY c.created_at DESC',
      [eventId]
    );
    res.json(comments);
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ message: '获取评论失败' });
  }
});

// 添加评论
app.post('/api/events/:id/comments', verifyToken, async (req, res) => {
  const eventId = req.params.id;
  const { content } = req.body;
  
  try {
    const [events] = await db.execute('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ message: '活动不存在' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO comments (event_id, user_id, content) VALUES (?, ?, ?)',
      [eventId, req.user.id, content]
    );
    
    const [comments] = await db.execute(
      'SELECT c.*, u.username FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?',
      [result.insertId]
    );
    
    res.json(comments[0]);
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ message: '添加评论失败' });
  }
});

// 删除评论
app.delete('/api/comments/:id', verifyToken, async (req, res) => {
  const commentId = req.params.id;
  
  try {
    const [comments] = await db.execute('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (comments.length === 0) {
      return res.status(404).json({ message: '评论不存在' });
    }
    
    // 将用户ID转换为数字进行比较
    const userId = parseInt(req.user.id);
    if (comments[0].user_id !== userId) {
      return res.status(403).json({ message: '无权删除此评论' });
    }
    
    await db.execute('DELETE FROM comments WHERE id = ?', [commentId]);
    
    res.json({ message: '删除评论成功' });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ message: '删除评论失败' });
  }
});

const greetings = [
  '您好！我是您的AI助手，很高兴为您服务！',
  '嗨！有什么我可以帮助您的吗？',
  '你好呀！欢迎使用校园活动平台~',
  '您好！请问今天有什么可以帮助您的？'
];

const thanksResponses = [
  '不客气！能帮到您我很开心~',
  '不用谢！有问题随时来找我哦！',
  '这是我应该做的！',
  '您太客气了，很高兴能帮到您！'
];

const positiveResponses = [
  '哈哈，谢谢您的夸奖！',
  '太好了！听到您这么说我很开心~',
  '谢谢！我会继续努力的！',
  '您的满意就是我最大的动力！'
];

const negativeResponses = [
  '很抱歉没能帮到您...',
  '对不起，让您失望了。',
  '非常抱歉，我会努力改进的！',
  '不好意思，我会尽力做得更好！'
];

const questionResponses = [
  '好的，我来帮您解答！',
  '让我想想...',
  '这个问题我来帮您分析一下。',
  '这是一个很好的问题！'
];

const topicResponses = {
  '活动': '关于活动相关的问题，您可以：\n1. 查看首页浏览所有活动\n2. 使用搜索功能查找特定活动\n3. 点击活动卡片查看详细信息\n4. 报名感兴趣的活动',
  '报名': '报名活动很简单：\n1. 找到您感兴趣的活动\n2. 点击活动详情页面\n3. 点击"立即报名"按钮\n4. 等待活动组织者确认',
  '收藏': '收藏功能可以帮助您：\n1. 快速找到喜欢的活动\n2. 随时查看活动状态更新\n3. 不错过任何重要信息\n点击活动卡片上的星标即可收藏',
  '发布': '发布活动步骤：\n1. 点击导航栏"发布活动"\n2. 填写活动详细信息\n3. 提交等待审核\n4. 审核通过后活动上线',
  '个人中心': '个人中心包含：\n1. 您的个人资料\n2. 已发布的活动\n3. 已报名的活动\n4. 收藏的活动列表',
  '帮助': '需要帮助吗？\n- 可以问我关于活动报名的问题\n- 如何发布新活动\n- 如何管理个人信息\n- 任何其他平台使用问题',
  '时间': '您可以在活动详情页查看活动的开始和结束时间哦！',
  '地点': '活动地点信息会在活动详情页面显示，包括具体地址和地图指引。',
  '取消': '取消报名可以在"我的报名"页面操作，找到对应活动点击取消即可。',
  '修改': '修改活动信息需要进入"我的活动"页面，选择要修改的活动进行编辑。',
  '删除': '删除活动需要进入"我的活动"页面，找到要删除的活动点击删除按钮。',
  '搜索': '您可以在首页使用搜索功能，输入关键词查找感兴趣的活动。',
  '通知': '当活动状态更新或有新消息时，系统会给您发送通知提醒。'
};

const casualResponses = [
  '今天天气真好呢！',
  '您今天过得怎么样？',
  '有什么有趣的事情想和我分享吗？',
  '感觉今天是个充满活力的一天！',
  '您最近有参加什么有趣的活动吗？',
  '校园里最近好像很热闹呢~',
  '学习之余也要记得放松哦！',
  '有什么想聊的都可以跟我说！'
];

const getAIResponse = (message) => {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('你好') || lowerMsg.includes('您好') || lowerMsg.includes('嗨') || lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  if (lowerMsg.includes('谢谢') || lowerMsg.includes('感谢') || lowerMsg.includes('thank')) {
    return thanksResponses[Math.floor(Math.random() * thanksResponses.length)];
  }
  
  if (lowerMsg.includes('好') && !lowerMsg.includes('不好') || lowerMsg.includes('棒') || lowerMsg.includes('厉害') || lowerMsg.includes('不错')) {
    return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
  }
  
  if (lowerMsg.includes('不好') || lowerMsg.includes('不行') || lowerMsg.includes('差') || lowerMsg.includes('糟糕')) {
    return negativeResponses[Math.floor(Math.random() * negativeResponses.length)];
  }
  
  if (lowerMsg.includes('？') || lowerMsg.includes('?') || lowerMsg.includes('吗')) {
    for (const [topic, response] of Object.entries(topicResponses)) {
      if (message.includes(topic)) {
        return response;
      }
    }
    return questionResponses[Math.floor(Math.random() * questionResponses.length)];
  }
  
  for (const [topic, response] of Object.entries(topicResponses)) {
    if (message.includes(topic)) {
      return response;
    }
  }
  
  if (lowerMsg.includes('聊') || lowerMsg.includes('说说') || lowerMsg.includes('谈谈') || lowerMsg.includes('讲讲')) {
    return casualResponses[Math.floor(Math.random() * casualResponses.length)];
  }
  
  const defaultResponses = [
    '好的，我明白了！我会帮您处理这个问题。',
    '感谢您的提问，让我来分析一下...',
    '这是一个很好的问题！让我为您详细解答。',
    '我理解您的需求，让我为您提供一些建议。',
    '根据您的描述，我建议您这样做：首先...然后...',
    '这个问题很有意思！让我思考一下最佳的解决方案。',
    '我已经收到您的请求，正在为您处理中...',
    '好的，让我为您整理一下相关信息。',
    '感谢您的信任，我会尽力帮助您！',
    '这是一个常见的问题，让我为您解答。',
    '您的想法很有趣！让我帮您分析一下。',
    '我来帮您看看有什么解决方案。',
    '请给我一点时间，我来帮您处理。'
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

app.post('/api/ai/chat', verifyToken, async (req, res) => {
  const { message } = req.body;
  
  try {
    const response = getAIResponse(message);
    
    setTimeout(() => {
      res.json({ 
        response,
        timestamp: new Date().toISOString()
      });
    }, Math.random() * 1000 + 500);
    
  } catch (error) {
    console.error('AI 助手错误:', error);
    res.status(500).json({ message: 'AI 助手服务暂时不可用' });
  }
});

app.get('/api/ai/help', verifyToken, async (req, res) => {
  try {
    const helpTopics = [
      { topic: '活动', description: '浏览和搜索活动' },
      { topic: '报名', description: '如何报名参加活动' },
      { topic: '收藏', description: '收藏喜欢的活动' },
      { topic: '发布', description: '发布新活动' },
      { topic: '个人中心', description: '管理个人信息' },
      { topic: '帮助', description: '获取更多帮助' }
    ];
    res.json({ helpTopics });
  } catch (error) {
    console.error('获取帮助信息失败:', error);
    res.status(500).json({ message: '获取帮助信息失败' });
  }
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.listen(port, () => {
  console.log(`后端服务运行在 http://localhost:${port}`);
});

// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const md5 = require('md5');

// 创建 Express 应用程序
const app = express();

// 创建 HTTP 服务器，并传入 Express 应用程序
const server = http.createServer(app);

// 初始化 Socket.IO 并传入 HTTP 服务器实例
const io = socketIo(server);

// 创建 MySQL 连接池
const pool = mysql.createPool({
  host: '127.0.0.1', // MySQL 服务器地址
  port: 3306, // MySQL 服务器端口号
  user: 'root', // 数据库用户的用户名
  password: '197311', // 数据库用户密码
  database: 'reg_log', // 数据库名称
  connectionLimit: 20, // 最大连接数
  charset: 'utf8' // 数据库服务器的编码方式
});

// 配置中间件
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080']
}));

// 用户注册接口
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // 检查用户名是否已存在
  let sql = 'SELECT COUNT(id) AS count FROM reg_log WHERE username=?';
  pool.query(sql, [username], (error, results) => {
    if (error) throw error;
    const count = results[0].count;
    if (count === 0) {
      // 插入新用户
      sql = 'INSERT INTO reg_log (username, password) VALUES (?, MD5(?))';
      pool.query(sql, [username, password], (error, results) => {
        if (error) throw error;
        res.send({ message: 'ok', code: 200 });
      });
    } else {
      res.send({ message: 'user exists', code: 201 });
    }
  });
});

// 用户登录接口
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 验证用户名和密码
  const sql = 'SELECT id, username FROM reg_log WHERE username=? AND password=MD5(?)';
  pool.query(sql, [username, password], (error, results) => {
    if (error) throw error;
    if (results.length === 0) {
      res.send({ message: 'login failed', code: 201 });
    } else {
      res.send({ message: 'ok', code: 200, result: results[0] });
    }
  });
});

// Socket.IO 事件处理
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', reason);
  });

  // 处理绘画消息
  socket.on('draw', (data) => {
    console.log('Received draw data from client:', data); // 调试信息
    socket.broadcast.emit('draw', data);
  });

  // 处理视频通话信令消息
  socket.on('offer', (data) => socket.broadcast.emit('offer', data));
  socket.on('answer', (data) => socket.broadcast.emit('answer', data));
  socket.on('candidate', (data) => socket.broadcast.emit('candidate', data));
});

// 静态文件服务
app.use(express.static('public'));

// 默认路由处理
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/Board.html');
});

// 启动服务器
server.listen(3000, () => {
  console.log('Server is running on port 3000.');
});
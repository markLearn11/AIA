/*
 * @Author: jihao00122 52628008+jihao00122@users.noreply.github.com
 * @Date: 2025-05-27 15:45:16
 * @LastEditors: jihao00122 52628008+jihao00122@users.noreply.github.com
 * @LastEditTime: 2025-05-27 17:24:06
 * @FilePath: /AiA/server/src/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import { socketHandler } from './utils/socketHandler';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 5001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// 创建HTTP服务器
const server = http.createServer(app);

// 设置Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 处理Socket.IO连接
io.on('connection', (socket) => {
  socketHandler(io, socket);
});

// 尝试连接到MongoDB，如果失败则使用内存存储
mongoose.connect('mongodb://127.0.0.1:27017/chat-app')
  .then(() => {
    console.log('已连接到MongoDB');
    startServer();
  })
  .catch((error) => {
    console.error('MongoDB连接错误:', error);
    console.log('将使用内存存储运行服务器');
    
    // 即使没有MongoDB也启动服务器
    startServer();
  });

// 启动服务器的函数
function startServer() {
  server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
} 
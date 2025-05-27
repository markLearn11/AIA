# 现代化聊天应用

一个基于React Native和Node.js的现代化聊天应用，提供实时消息传递、用户管理和多种聊天功能。

## 功能特点

- 用户注册和登录
- 实时消息传递
- 私聊和群聊支持
- 消息已读状态
- 用户在线状态
- 正在输入指示器
- 支持文本、图片、视频等多种消息类型
- 深色模式支持
- 响应式设计

## 技术栈

### 前端
- React Native
- TypeScript
- React Navigation
- Socket.IO Client
- React Native Gifted Chat
- AsyncStorage

### 后端
- Node.js
- Express
- MongoDB
- Socket.IO
- JWT认证
- TypeScript

## 安装与运行

### 前提条件
- Node.js (v18+)
- npm 或 yarn
- MongoDB
- React Native开发环境

### 后端设置
1. 进入server目录
```bash
cd server
```

2. 安装依赖
```bash
npm install
```

3. 创建.env文件并配置环境变量
```
PORT=8888
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

4. 启动开发服务器
```bash
npm run dev
```

### 前端设置
1. 在项目根目录安装依赖
```bash
npm install
```

2. 启动Metro服务器
```bash
npm start
```

3. 在另一个终端运行应用
```bash
# 对于Android
npm run android

# 对于iOS
npm run ios
```

## 项目结构

```
/
├── src/                    # 前端源代码
│   ├── assets/             # 图片、字体等静态资源
│   ├── components/         # 可复用组件
│   ├── context/            # React上下文
│   ├── hooks/              # 自定义钩子
│   ├── navigation/         # 导航配置
│   ├── screens/            # 应用屏幕
│   ├── services/           # API服务
│   └── utils/              # 工具函数
├── server/                 # 后端源代码
│   ├── src/                # 后端TypeScript源代码
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   └── utils/          # 工具函数
│   └── dist/               # 编译后的JavaScript代码
└── README.md               # 项目文档
```

## 使用说明

1. 注册新账号或使用以下测试账号登录：
   - 邮箱: test@example.com
   - 密码: password

2. 在联系人页面查找并添加其他用户

3. 开始聊天！

## 后续开发计划

- [ ] 添加推送通知
- [ ] 支持语音和视频通话
- [ ] 添加消息搜索功能
- [ ] 支持消息撤回和编辑
- [ ] 添加更多消息类型（位置、文件等）
- [ ] 优化性能和用户体验

## 贡献

欢迎提交问题和拉取请求！

## 许可证

MIT

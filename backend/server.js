const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { isClean } = require('./contentFilter');
const { initDb, dbHelper } = require('./db');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Production CORS: Allow your frontend URL here
const app = express();
app.set('trust proxy', 1); // Required for Render/Vercel proxies
app.use(cors({
  origin: "*", // In production, you can restrict this to your actual domain
  methods: ["GET", "POST"]
}));
app.use(express.json());

// ==========================================
// RATE LIMITING (Security)
// ==========================================
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window for admin routes
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const server = http.createServer(app);

// Matchmaking state
let waitingPool = [];
const activeRooms = new Map();
const violations = new Map(); // socketId -> count

// Admin key from env
const ADMIN_KEY = process.env.ADMIN_KEY || 'anime-roulette-admin-2026';

const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

const MATCH_INTERVAL = 2000;
const CHAT_DURATION = 5 * 60;
const MAX_EXTENSIONS = 1;
const EXTEND_VOTE_TIMEOUT = 10000;
const MAX_VIOLATIONS = 3;

// ==========================================
// IP BANNING MIDDLEWARE
// ==========================================
io.use(async (socket, next) => {
  const ip = socket.handshake.address;
  const isBanned = await dbHelper.isBanned(ip);
  if (isBanned) {
    console.log(`Banned IP attempted to connect: ${ip}`);
    return next(new Error('Your IP is permanently banned from Anime Roulette.'));
  }
  next();
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} (${socket.handshake.address})`);
  violations.set(socket.id, 0);

  const emitOnlineUsers = () => {
    const realUsers = io.engine.clientsCount;
    const inflatedUsers = realUsers + Math.floor(Math.random() * 8) + 8;
    io.emit('online_users_update', inflatedUsers);
  };
  
  emitOnlineUsers();
  
  socket.on('join_queue', (data) => {
    const nickname = data.nickname || 'Anonymous Weeb';
    if (!waitingPool.find(u => u.id === socket.id)) {
      waitingPool.push({ id: socket.id, nickname, socket });
    }
  });

  socket.on('send_message', async (data) => {
    if (!data.room || !data.message) return;
    const room = activeRooms.get(data.room);
    if (!room) return;

    const filterResult = isClean(data.message);
    if (!filterResult.clean) {
      socket.emit('message_blocked', { reason: filterResult.reason });
      const count = (violations.get(socket.id) || 0) + 1;
      violations.set(socket.id, count);
      if (count >= MAX_VIOLATIONS) {
        socket.emit('kicked_for_violations');
        handleUserLeaving(socket, data.room);
      }
      return;
    }

    const messagePayload = {
      senderId: socket.id,
      nickname: data.nickname || 'Partner',
      message: data.message,
      timestamp: new Date().toISOString()
    };

    socket.to(data.room).emit('receive_message', messagePayload);

    if (room.messages) {
      room.messages.push(messagePayload);
      if (room.messages.length > 30) room.messages = room.messages.slice(-30);
    }

    await dbHelper.incrementStat('total_messages');
  });

  socket.on('extend_vote', (roomId) => {
    const room = activeRooms.get(roomId);
    if (!room || !room.extendVoting) return;
    if (!room.extendVotes) room.extendVotes = new Set();
    room.extendVotes.add(socket.id);

    if (room.extendVotes.size >= 2) {
      clearTimeout(room.extendTimeout);
      room.extendVoting = false;
      room.extensions = (room.extensions || 0) + 1;
      room.timeLeft = CHAT_DURATION;

      room.timerInterval = setInterval(() => {
        room.timeLeft -= 1;
        io.to(roomId).emit('timer_update', room.timeLeft);
        if (room.timeLeft <= 0) {
          clearInterval(room.timerInterval);
          const currentRoom = activeRooms.get(roomId);
          if (currentRoom && (!currentRoom.extensions || currentRoom.extensions < MAX_EXTENSIONS)) {
            startExtendVoting(roomId, currentRoom);
          } else {
            io.to(roomId).emit('chat_ended', 'Time\'s up! Maximum chat time reached.');
            io.in(roomId).socketsLeave(roomId);
            activeRooms.delete(roomId);
          }
        }
      }, 1000);

      io.to(roomId).emit('chat_extended', { newTime: CHAT_DURATION });
    } else {
      socket.to(roomId).emit('partner_wants_extend');
    }
  });

  socket.on('extend_decline', (roomId) => {
    const room = activeRooms.get(roomId);
    if (!room || !room.extendVoting) return;
    clearTimeout(room.extendTimeout);
    room.extendVoting = false;
    io.to(roomId).emit('chat_ended', 'Time\'s up! Chat not extended.');
    io.in(roomId).socketsLeave(roomId);
    activeRooms.delete(roomId);
  });

  socket.on('report_user', async (data) => {
    const { roomId } = data;
    const room = activeRooms.get(roomId);
    if (!room) return;

    const reportedId = room.users.find(id => id !== socket.id);
    const report = {
      id: `report_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      roomId,
      reporterId: socket.id,
      reportedId: reportedId || 'unknown',
      messages: room.messages ? [...room.messages] : [],
    };

    await dbHelper.saveReport(report);
    await dbHelper.incrementStat('total_reports');
    socket.emit('report_confirmed');
  });

  socket.on('leave_chat', (room) => {
    handleUserLeaving(socket, room);
  });

  socket.on('disconnect', () => {
    violations.delete(socket.id);
    waitingPool = waitingPool.filter(u => u.id !== socket.id);
    for (const [roomId, roomData] of activeRooms.entries()) {
      if (roomData.users.includes(socket.id)) {
        handleUserLeaving(socket, roomId);
        break;
      }
    }
  });
});

function startExtendVoting(roomId, room) {
  room.extendVoting = true;
  room.extendVotes = new Set();
  io.to(roomId).emit('extend_offer');
  room.extendTimeout = setTimeout(() => {
    if (room.extendVoting) {
      room.extendVoting = false;
      io.to(roomId).emit('chat_ended', 'Time\'s up! Extension timed out.');
      io.in(roomId).socketsLeave(roomId);
      activeRooms.delete(roomId);
    }
  }, EXTEND_VOTE_TIMEOUT);
}

function handleUserLeaving(socket, roomId) {
  const roomData = activeRooms.get(roomId);
  if (roomData) {
    socket.to(roomId).emit('partner_left');
    if (roomData.timerInterval) clearInterval(roomData.timerInterval);
    if (roomData.extendTimeout) clearTimeout(roomData.extendTimeout);
    io.in(roomId).socketsLeave(roomId);
    activeRooms.delete(roomId);
  }
}

// ==========================================
// MATCHMAKING WORKER
// ==========================================
setInterval(async () => {
  if (waitingPool.length >= 2) {
    const user1 = waitingPool.shift();
    const user2 = waitingPool.shift();
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    user1.socket.join(roomId);
    user2.socket.join(roomId);

    user1.socket.emit('match_found', { 
      roomId, 
      partnerNickname: user2.nickname,
      partnerId: user2.id
    });
    
    user2.socket.emit('match_found', { 
      roomId, 
      partnerNickname: user1.nickname,
      partnerId: user1.id
    });

    await dbHelper.incrementStat('total_matches');

    let timeLeft = CHAT_DURATION;
    const timerInterval = setInterval(() => {
      timeLeft -= 1;
      const room = activeRooms.get(roomId);
      if (room) room.timeLeft = timeLeft;
      io.to(roomId).emit('timer_update', timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        const currentRoom = activeRooms.get(roomId);
        if (currentRoom && (!currentRoom.extensions || currentRoom.extensions < MAX_EXTENSIONS)) {
          startExtendVoting(roomId, currentRoom);
        } else {
          io.to(roomId).emit('chat_ended', 'Time\'s up! Maximum chat time reached.');
          io.in(roomId).socketsLeave(roomId);
          activeRooms.delete(roomId);
        }
      }
    }, 1000);

    activeRooms.set(roomId, {
      users: [user1.id, user2.id],
      timerInterval,
      timeLeft,
      messages: [],
      extensions: 0,
      extendVoting: false,
    });
  }
}, MATCH_INTERVAL);

// ==========================================
// ADMIN ENDPOINTS (Hardened)
// ==========================================

const checkAdminKey = (req, res, next) => {
  const key = req.query.key || req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

app.get('/admin/stats', adminLimiter, checkAdminKey, async (req, res) => {
  const dbStats = await dbHelper.getStats();
  const uptimeMs = Date.now() - (process.uptime() * 1000); // Simple uptime

  res.json({
    realUsers: io.engine.clientsCount,
    inflatedUsers: io.engine.clientsCount + Math.floor(Math.random() * 8) + 8,
    activeRooms: activeRooms.size,
    queueSize: waitingPool.length,
    matchesToday: dbStats.total_matches || 0,
    messagesToday: dbStats.total_messages || 0,
    reportsToday: dbStats.total_reports || 0,
    totalReports: dbStats.total_reports || 0,
    uptimeHours: Math.round((process.uptime() / 3600) * 10) / 10,
  });
});

app.get('/admin/reports', adminLimiter, checkAdminKey, async (req, res) => {
  const allReports = await dbHelper.getReports(50);
  res.json({ reports: allReports, total: allReports.length });
});

app.post('/admin/kick', adminLimiter, checkAdminKey, (req, res) => {
  const { socketId, reason } = req.body;
  const targetSocket = io.sockets.sockets.get(socketId);
  if (targetSocket) {
    targetSocket.emit('chat_ended', reason || 'You have been kicked by an admin.');
    targetSocket.disconnect(true);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/admin/ban', adminLimiter, checkAdminKey, async (req, res) => {
  const { socketId, reason } = req.body;
  const targetSocket = io.sockets.sockets.get(socketId);
  if (targetSocket) {
    const ip = targetSocket.handshake.address;
    await dbHelper.banIp(ip, reason || 'Banned by admin');
    targetSocket.emit('chat_ended', 'You have been PERMANENTLY banned.');
    targetSocket.disconnect(true);
    res.json({ success: true, ip });
  } else {
    // If socket is already gone, check if IP was provided
    const { ip } = req.body;
    if (ip) {
      await dbHelper.banIp(ip, reason || 'Banned by admin');
      res.json({ success: true, ip });
    } else {
      res.status(404).json({ error: 'User not found and no IP provided' });
    }
  }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3001;
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Admin key: ${ADMIN_KEY}`);
  });
});

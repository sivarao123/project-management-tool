let io = null;
const onlineUsers = new Map(); // userId -> Set of socket IDs

function initSocket(socketIO) {
  io = socketIO;

  io.on('connection', (socket) => {
    let currentUserId = null;

    socket.on('user:online', (user) => {
      if (!user || !user.id) return;
      currentUserId = user.id;

      if (!onlineUsers.has(currentUserId)) {
        onlineUsers.set(currentUserId, new Set());
      }
      onlineUsers.get(currentUserId).add(socket.id);

      // Join individual user room for private notifications
      socket.join(`user:${currentUserId}`);

      // Broadcast user online status
      io.emit('presence:update', {
        userId: currentUserId,
        status: 'online',
        onlineCount: onlineUsers.size
      });
    });

    socket.on('join:project', (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on('leave:project', (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    socket.on('typing:start', ({ taskId, userName }) => {
      socket.to(`task:${taskId}`).emit('typing:status', { taskId, userName, isTyping: true });
    });

    socket.on('typing:stop', ({ taskId, userName }) => {
      socket.to(`task:${taskId}`).emit('typing:status', { taskId, userName, isTyping: false });
    });

    socket.on('disconnect', () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const sockets = onlineUsers.get(currentUserId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(currentUserId);
          io.emit('presence:update', {
            userId: currentUserId,
            status: 'offline',
            onlineCount: onlineUsers.size
          });
        }
      }
    });
  });

  console.log('[Socket.io] Real-time engine initialized.');
}

function getIO() {
  return io;
}

function emitToProject(projectId, event, data) {
  if (io && projectId) {
    io.to(`project:${projectId}`).emit(event, data);
  }
}

function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

function emitGlobal(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToProject,
  emitToUser,
  emitGlobal
};

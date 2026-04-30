# Interview System: Best Practices & Improvements

## 📋 Overview

This document outlines best practices for building a scalable, reliable interview system that handles real-time collaboration without persisting session data.

---

## 🏗️ Architecture Best Practices

### 1. **Ephemeral Session Management**

**Best Practice: Sessions exist only during active interview**

```
Database (Persistent):
├── Interview Document (static metadata)
├── Feedback Data (stored after completion)
├── Code Snapshots (periodic captures)
└── Chat Messages (archived)

Memory/Redis (Ephemeral):
├── Active Session State
├── Real-time Cursor Positions
├── WebRTC Signaling Data
└── Timer/Duration Info
```

### 2. **Session Lifecycle**

```
┌─────────────────────────────────────────────┐
│                                             │
│  Interview Created (DB)                     │
│  ↓                                          │
│  Instructor Starts Interview                │
│  ├── Create Session in Memory/Redis         │
│  └── Start Timer & Broadcasting            │
│  ↓                                          │
│  Real-time Collaboration (Socket.IO)        │
│  ├── Code Changes (broadcast only)          │
│  ├── Chat Messages (save to DB)             │
│  ├── Periodic Snapshots (save to DB)        │
│  └── Cursor Sync (broadcast only)           │
│  ↓                                          │
│  Interview Ends                             │
│  ├── Save Final Feedback to DB              │
│  ├── Clear Session from Memory              │
│  ├── Emit "interview-finished" event        │
│  └── Archive Chat/Snapshots                 │
│                                             │
└─────────────────────────────────────────────┘
```

### 3. **Data Storage Strategy**

**Persistent (Database):**
- Interview metadata (title, duration, instructor)
- Feedback scores and notes
- Code snapshots (every 5-10 minutes)
- Chat messages (save in real-time)
- Timestamps and events

**Ephemeral (Memory/Redis):**
- Active timer state
- Current code being edited (synced to DB on end)
- Cursor positions
- WebRTC signaling
- User presence info

**On Interview End: DELETE FROM MEMORY**
```javascript
// Delete all ephemeral data
await redis.del(`interview:${interviewId}:state`);
await redis.del(`interview:${interviewId}:timer`);
await redis.del(`interview:${interviewId}:cursors`);
await redis.del(`interview:${interviewId}:presence`);
```

---

## 🎯 Best Practices Implementation

### 1. **Use Redis for Session State (Not MongoDB)**

```javascript
// DON'T: Store real-time state in MongoDB
// ❌ Updates 100+ times per minute
interview.state.code = newCode;
await interview.save(); // SLOW & EXPENSIVE

// DO: Use Redis for ephemeral data
// ✅ Fast, designed for this
await redis.set(`interview:${id}:code`, newCode, 'EX', 3600);
```

### 2. **Implement Graceful Cleanup**

```javascript
// Clean up on interview end
const endInterview = async (interviewId) => {
  // 1. Save final state to DB
  const session = await redis.get(`interview:${interviewId}:state`);
  if (session) {
    await Interview.findByIdAndUpdate(interviewId, {
      'state.code': session.code,
      'state.language': session.language,
      status: 'finished',
      endedAt: new Date()
    });
  }

  // 2. Delete all ephemeral data
  await redis.del(`interview:${interviewId}:*`);

  // 3. Notify all participants
  io.to(`interview:${interviewId}`).emit('interview-finished', {
    timestamp: new Date()
  });

  // 4. Close socket connections
  io.to(`interview:${interviewId}`).disconnectSockets();
};
```

### 3. **Socket.IO Best Practices**

```javascript
// Middleware: Validate & authenticate every socket event
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

// Event: Use namespaces & rooms
// ✅ Good
socket.on('interview-code-update', (data) => {
  socket.to(`interview:${data.interviewId}`).emit('code-updated', data);
});

// ❌ Avoid: Broadcasting to everyone
socket.emit('broadcast', data); // Reaches all users globally

// Event: Always validate data
socket.on('update-feedback', (data) => {
  // Validate before processing
  if (!data.score || data.score < 1 || data.score > 5) {
    return socket.emit('error', { msg: 'Invalid score' });
  }
  // Process...
});
```

### 4. **Memory Management**

```javascript
// Set expiration on all Redis keys
const INTERVIEW_TTL = 24 * 60 * 60; // 24 hours

await redis.set(
  `interview:${id}:state`,
  JSON.stringify(state),
  'EX',
  INTERVIEW_TTL
);

// Auto-cleanup for abandoned sessions
const cleanupAbandonedSessions = async () => {
  const keys = await redis.keys('interview:*:active');
  for (const key of keys) {
    const interviewId = key.split(':')[1];
    const lastActivity = await redis.get(`${key}:lastActivity`);
    
    // If no activity for 2 hours, cleanup
    if (Date.now() - lastActivity > 2 * 60 * 60 * 1000) {
      await redis.del(`interview:${interviewId}:*`);
      console.log(`Cleaned up abandoned session: ${interviewId}`);
    }
  }
};

// Run every hour
setInterval(cleanupAbandonedSessions, 60 * 60 * 1000);
```

### 5. **Snapshot Strategy**

```javascript
// Save snapshots periodically (not continuously)
// ✅ Every 5 minutes
const SNAPSHOT_INTERVAL = 5 * 60 * 1000;

socket.on('interview-code-update', async ({ interviewId, code, language }) => {
  const lastSnapshot = await redis.get(`interview:${interviewId}:lastSnapshot`);
  
  if (Date.now() - lastSnapshot > SNAPSHOT_INTERVAL) {
    // Save to database
    await Interview.findByIdAndUpdate(interviewId, {
      $push: {
        snapshots: {
          code,
          language,
          timestamp: new Date(),
          isAutomatic: true
        }
      }
    });
    
    await redis.set(`interview:${interviewId}:lastSnapshot`, Date.now());
  }
  
  // Broadcast to other participants
  socket.to(`interview:${interviewId}`).emit('code-updated', { code });
});
```

### 6. **Error Recovery**

```javascript
// Handle unexpected disconnections
socket.on('disconnect', async () => {
  const interviewId = socket.interviewId;
  const role = socket.role;

  // Save current state immediately
  const session = await redis.get(`interview:${interviewId}:state`);
  if (session) {
    await Interview.findByIdAndUpdate(interviewId, {
      'state.code': session.code
    });
  }

  // Notify other participant
  io.to(`interview:${interviewId}`).emit('participant-disconnected', {
    role,
    socketId: socket.id
  });

  // Auto-cleanup after 30 minutes of inactivity
  setTimeout(async () => {
    const active = io.sockets.adapter.rooms.get(`interview:${interviewId}`);
    if (!active || active.size === 0) {
      // No one connected, cleanup
      await Interview.findByIdAndUpdate(interviewId, {
        status: 'paused'
      });
      await redis.del(`interview:${interviewId}:*`);
    }
  }, 30 * 60 * 1000);
});
```

---

## 🎨 Frontend Best Practices

### 1. **Reconnection Logic**

```javascript
// Store interview state locally during connection issues
const useInterviewStore = create((set) => ({
  // Local cache
  localCode: '',
  localLanguage: 'cpp',
  
  // Reconnection
  reconnect: async (interviewId) => {
    try {
      // Fetch latest state from server
      const res = await fetch(`/api/interview/${interviewId}`);
      const interview = await res.json();
      
      set({
        localCode: interview.state.code,
        localLanguage: interview.state.language
      });
    } catch (err) {
      // Use local cache if fetch fails
      console.log('Using local cache during reconnect');
    }
  }
}));
```

### 2. **Handle Session Expiry**

```javascript
// Monitor connection status
useEffect(() => {
  const handleDisconnect = () => {
    toast.warning('Connection lost. Reconnecting...');
    // Keep local state, attempt reconnect
  };

  const handleReconnect = () => {
    toast.success('Reconnected');
    // Sync state with server
    interviewStore.reconnect(interviewId);
  };

  socket.on('disconnect', handleDisconnect);
  socket.on('connect', handleReconnect);

  return () => {
    socket.off('disconnect', handleDisconnect);
    socket.off('connect', handleReconnect);
  };
}, []);
```

### 3. **UI/UX Improvements**

```jsx
// Show session status clearly
<SessionStatus>
  {/* Timer */}
  <Timer 
    totalTime={interview.duration * 60}
    onTimeUp={() => endInterview()}
  />
  
  {/* Connection Status */}
  <ConnectionIndicator 
    connected={socket.connected}
    participants={participants.length}
  />
  
  {/* Participant List */}
  <ParticipantList 
    instructor={instructor}
    candidate={candidate}
  />
</SessionStatus>

// Clear action buttons
<ActionBar>
  <Button onClick={pauseInterview}>Pause</Button>
  <Button onClick={saveSnapshot}>Save Code</Button>
  <Button onClick={endInterview} variant="danger">End Interview</Button>
</ActionBar>
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Memory Leak - Sessions Never Delete

**Problem:** Sessions accumulate in memory after interview ends
```javascript
// ❌ BAD: Session not deleted
io.to(`interview:${id}`).emit('finished');
// But session key still exists in Redis
```

**Solution:** Explicitly delete on interview end
```javascript
// ✅ GOOD: Clear all session data
const endInterview = async (interviewId) => {
  // Save to DB
  await saveInterviewToDB(interviewId);
  
  // Delete from memory
  const pattern = `interview:${interviewId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  
  // Emit event
  io.to(`interview:${interviewId}`).emit('finished');
};
```

### Issue 2: Data Loss on Unexpected Disconnect

**Problem:** Code changes lost when connection drops
```javascript
// ❌ BAD: Only broadcast, don't persist
socket.on('code-change', (code) => {
  socket.to(room).emit('code-updated', code);
});
```

**Solution:** Save periodically + on disconnect
```javascript
// ✅ GOOD: Hybrid approach
socket.on('code-change', async (code) => {
  // 1. Save to Redis immediately
  await redis.set(`interview:${id}:code`, code);
  
  // 2. Broadcast to peers
  socket.to(room).emit('code-updated', code);
  
  // 3. Save to DB every 5 minutes (via periodic task)
});

socket.on('disconnect', async () => {
  // Save current state to DB immediately
  const code = await redis.get(`interview:${id}:code`);
  await Interview.updateOne(
    { _id: id },
    { 'state.code': code }
  );
});
```

### Issue 3: Latency in Real-time Updates

**Problem:** Cursor position, code changes feel sluggish
```javascript
// ❌ BAD: Save every change to DB
socket.on('cursor-move', async (data) => {
  await Cursor.updateOne({ interviewId }, data);
});
```

**Solution:** Broadcast only, don't persist
```javascript
// ✅ GOOD: Only broadcast (no DB write)
socket.on('cursor-move', (data) => {
  socket.to(room).emit('cursor-updated', data);
});
```

---

## 📊 Performance Optimization

### Database Queries
```javascript
// ❌ SLOW: N+1 problem
const interviews = await Interview.find({ instructor: id });
for (const iv of interviews) {
  iv.candidate = await User.findOne({ email: iv.candidate.email });
}

// ✅ FAST: Single query with populate
const interviews = await Interview.find({ instructor: id })
  .populate('questions.problemId')
  .lean();
```

### Cache Frequently Accessed Data
```javascript
// Cache interview details for 5 minutes
const getInterview = async (id) => {
  const cached = await redis.get(`interview:${id}:details`);
  if (cached) return JSON.parse(cached);
  
  const interview = await Interview.findById(id).lean();
  await redis.set(
    `interview:${id}:details`,
    JSON.stringify(interview),
    'EX',
    300
  );
  return interview;
};
```

---

## ✅ Checklist

- [ ] Sessions stored in Redis, not MongoDB
- [ ] Cleanup scheduled on interview end
- [ ] Snapshots saved every 5-10 minutes (not continuously)
- [ ] Socket events validated server-side
- [ ] Graceful reconnection handling
- [ ] Memory expiration set for all Redis keys
- [ ] Chat messages saved in real-time
- [ ] Feedback saved to DB, not in memory
- [ ] Error recovery implemented
- [ ] Connection status shown to users
- [ ] Abandoned sessions cleaned up
- [ ] Rate limiting on socket events

---

## 🔗 Resources

- [Socket.IO Best Practices](https://socket.io/docs/v4/best-practices/)
- [Redis Design Patterns](https://redis.io/topics/patterns)
- [MongoDB Indexing Guide](https://docs.mongodb.com/manual/indexes/)
- [Real-time Systems Architecture](https://en.wikipedia.org/wiki/Real-time_computing)


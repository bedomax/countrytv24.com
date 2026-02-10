import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { autoUpdateService } from '../services/auto-update-service.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Only initialize Socket.IO if not in Vercel (Vercel doesn't support persistent WebSockets)
const isVercel = process.env.VERCEL === '1';
let io: SocketIOServer | null = null;

if (!isVercel) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
}

const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Serve static files from web app public directory
app.use(express.static(path.join(__dirname, '../../apps/web/public')));

// Track connected users (only for local development)
let connectedUsers = new Set();
let viewerCount = 0;

// Socket.IO connection handling (only if Socket.IO is available)
if (io) {
  io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);
    
    // Add user to connected set
    connectedUsers.add(socket.id);
    viewerCount = connectedUsers.size;
    
    // Broadcast updated viewer count
    io.emit('viewerCount', viewerCount);
    console.log(`📊 Current viewers: ${viewerCount}`);
    
    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log('👋 User disconnected:', socket.id);
      
      // Remove user from connected set
      connectedUsers.delete(socket.id);
      viewerCount = connectedUsers.size;
      
      // Broadcast updated viewer count
      io.emit('viewerCount', viewerCount);
      console.log(`📊 Current viewers: ${viewerCount}`);
    });
  });
}

// API endpoint for viewer count (for Vercel compatibility)
app.get('/api/viewer-count', (req, res) => {
  // Set CORS headers for Vercel
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (isVercel) {
    // In Vercel, return a simulated count based on time
    const baseCount = 1200;
    const timeVariation = Math.floor(Date.now() / 10000) % 100;
    const viewerCount = baseCount + timeVariation;
    console.log(`📊 Vercel simulated viewer count: ${viewerCount}`);
    res.json({ count: viewerCount });
  } else {
    // In local development, return real count
    console.log(`📊 Local real viewer count: ${viewerCount}`);
    res.json({ count: viewerCount });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auto-update status endpoint
app.get('/api/update-status', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json(autoUpdateService.getStatus());
});

// Manual update trigger endpoint
app.post('/api/trigger-update', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  try {
    // Trigger update asynchronously
    autoUpdateService.triggerUpdate();
    res.json({ status: 'update triggered', message: 'Playlist update started' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to trigger update' });
  }
});

// Get new songs endpoint
app.get('/api/new-songs', (_req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  try {
    const PLAYLIST_FILE = path.join(__dirname, '../../apps/web/public/playlist.json');

    if (fs.existsSync(PLAYLIST_FILE)) {
      const data = fs.readFileSync(PLAYLIST_FILE, 'utf-8');
      const playlist = JSON.parse(data);
      const newSongs = playlist.songs.filter((song: any) => song.isNew === true);

      res.json({
        count: newSongs.length,
        songs: newSongs,
        lastUpdated: playlist.lastUpdated
      });
    } else {
      res.json({ count: 0, songs: [], lastUpdated: null });
    }
  } catch (error) {
    console.error('Error reading new songs:', error);
    res.status(500).json({ error: 'Failed to read new songs' });
  }
});

// --- Mem0 Memory Endpoints ---
app.post('/api/mem0', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  try {
    const { mem0Service } = await import('../services/mem0-service.js');

    const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipShort = ip.toString().substring(0, 8);
    const uaShort = userAgent.toString().substring(0, 8);
    const userId = `${ipShort}_${uaShort}`;

    const { action, song } = req.body;

    if (action === 'play') {
      await mem0Service.recordSongPlay(userId, song);
    } else if (action === 'like') {
      await mem0Service.recordLike(userId, song);
    } else if (action === 'skip') {
      await mem0Service.recordSkip(userId, song);
    }

    res.json({ status: 'ok', userId });
  } catch (error) {
    console.error('Mem0 error:', error);
    res.status(500).json({ error: 'Mem0 service error' });
  }
});

app.get('/api/mem0', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  try {
    const { mem0Service } = await import('../services/mem0-service.js');

    const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipShort = ip.toString().substring(0, 8);
    const uaShort = userAgent.toString().substring(0, 8);
    const userId = `${ipShort}_${uaShort}`;

    const action = req.query.action;

    if (action === 'memories') {
      const memories = await mem0Service.getUserMemories(userId);
      return res.json({ userId, memories });
    }

    if (action === 'recommendations') {
      const results = await mem0Service.searchMemories(userId, 'songs and artists I like');
      return res.json({ userId, recommendations: results });
    }

    const memories = await mem0Service.getUserMemories(userId);
    res.json({ userId, memoryCount: memories?.length || 0, hasMemories: (memories?.length || 0) > 0 });
  } catch (error) {
    console.error('Mem0 error:', error);
    res.status(500).json({ error: 'Mem0 service error' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log('🎸 CountryTV24 Server is running!');
  console.log('');
  console.log(`   🌐 Open in browser: http://localhost:${PORT}`);
  if (isVercel) {
    console.log('   📊 Simulated viewer counter (Vercel mode)');
  } else {
    console.log('   📊 Real-time viewer counter enabled');
  }
  console.log('');
  console.log('   Controls:');
  console.log('   - Click on playlist items to change songs');
  console.log('   - Arrow Right / N: Next song');
  console.log('   - Arrow Left / P: Previous song');
  console.log('   - Space: Play/Pause');
  console.log('');
  console.log('   Press Ctrl+C to stop the server');
  console.log('');

  // Start auto-update service (only if not in Vercel)
  if (!isVercel) {
    autoUpdateService.start();
  }
});

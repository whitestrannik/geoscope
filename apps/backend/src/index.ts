import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/index.js';
import { createContext } from './lib/auth.js';
import { initializeSocket } from './lib/socket.js';
import { env } from './lib/env.js';

const app = express();
const server = createServer(app);

const PORT = env.PORT;

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// tRPC API endpoint
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'GeoScope Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Initialize Socket.IO for multiplayer rooms
const io = initializeSocket(server);

// Start server
server.listen(PORT, () => {

}); 
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { sequelize } from './models/index.js';
import authRoutes from './api/auth.js';
import adminRoutes from './api/admin.js';
import companyRoutes from './api/company.js';
import clientRoutes from './api/client.js';
import setupSockets from './sockets/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Créer io (UNIQUEMENT UNE FOIS)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// ✅ Configurer les sockets
setupSockets(io);

app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'QueuePay API is running',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/client', clientRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        await sequelize.sync({ force: false });
        console.log('✅ Database synchronized');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
            console.log(`🔌 WebSocket enabled on same port`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export { app, server };
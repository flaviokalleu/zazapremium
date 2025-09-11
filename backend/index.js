import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { initializeSocket } from './services/socket.js';
import { autoReconnectSessions, startSessionHealthCheck } from './services/sessionManager.js';
import RedisService from './services/redisService.js';
// Removed whatsappjs and selection routes; using only Baileys
import baileysRoutes from './routes/baileysRoutes.js';
import whatsappjsRoutes from './routes/whatsappjsRoutes.js';
import wwebjsAdvancedRoutes from './routes/wwebjsAdvanced.js';
import authRoutes from './routes/authRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import userRoutes from './routes/userRoutes.js';
import ticketCommentRoutes from './routes/ticketCommentRoutes.js';
import ticketStatusRoutes from './routes/ticketStatusRoutes.js';
import ticketMessageRoutes from './routes/ticketMessageRoutes.js';
import ticketMessageFileRoutes from './routes/ticketMessageFileRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import queueIntegrationRoutes from './routes/queueIntegrationRoutes.js';
import sessionIntegrationRoutes from './routes/sessionIntegrationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import sessionLibraryRoutes from './routes/sessionLibrary.js';
import libraryManagerRoutes from './routes/libraryManager.js';
import contactRoutes from './routes/contactRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import quickReplyRoutes from './routes/quickReplyRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import buttonRoutes from './routes/buttonRoutes.js';
import multiChannelRoutes from './routes/multiChannelRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import companyRoutes from './routes/companies.js';
import path from 'path';
import sequelize from './services/sequelize.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Inicializar Socket.IO
const io = initializeSocket(server);

// Middlewares
// Permitir APENAS o(s) frontend(s) definido(s) em FRONTEND_URL (pode ser único ou CSV)
// Variável unificada: FRONTEND_URL
const parseAllowedOrigins = () => {
  const raw = process.env.FRONTEND_URL || '';
  const fromEnv = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;
  // Fallback amigável apenas em desenvolvimento
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    return ['http://localhost:3000'];
  }
  return [];
};

const ALLOWED_ORIGINS = parseAllowedOrigins();
const isAllowedOrigin = (origin) => !!origin && ALLOWED_ORIGINS.includes(origin);

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sem origin (como mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    console.log(`🚫 CORS bloqueado para origem: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos enviados
// Caminho público correto: /uploads/arquivo.ext (NÃO /api/uploads)
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Rota de teste para verificar se os arquivos estão sendo servidos
app.get('/test-file/:folder/:filename', (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', folder, filename);
  console.log('🔍 Testando arquivo:', filePath);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Erro ao servir arquivo:', err);
      res.status(404).send('Arquivo não encontrado');
    } else {
      console.log('✅ Arquivo servido com sucesso');
    }
  });
});

// Rotas principais
app.use('/api/baileys', baileysRoutes);
app.use('/api/wwebjs', whatsappjsRoutes);
app.use('/api/wwebjs-advanced', wwebjsAdvancedRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ticket-comments', ticketCommentRoutes);
app.use('/api/ticket-status', ticketStatusRoutes);
app.use('/api/ticket-messages', ticketMessageRoutes);
app.use('/api/ticket-messages', ticketMessageFileRoutes);
app.use('/api/quick-replies', quickReplyRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/buttons', buttonRoutes);
app.use('/api/mc', multiChannelRoutes); // multi-channel (whatsapp/instagram/facebook)
app.use('/api/integrations', integrationRoutes);
app.use('/api/queue-integrations', queueIntegrationRoutes);
app.use('/api/session-integrations', sessionIntegrationRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/session-library', sessionLibraryRoutes);
app.use('/api/library-manager', libraryManagerRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/push', pushRoutes);

app.get('/', (req, res) => {
  res.send('Zazap Backend API');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, async () => {
  console.log(`🚀 Backend running on ${HOST}:${PORT}`);
  // Testar conexão com banco na subida
  try {
    await sequelize.authenticate();
    console.log('🗄️ Conexão com banco verificada com sucesso');
  } catch (e) {
    console.error('❌ Falha ao conectar ao banco:', e.message);
  }
  console.log(`🌐 Accessible at:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://192.168.1.100:${PORT} (replace with your IP)`);
  console.log(`   - All interfaces: http://${HOST}:${PORT}`);
  console.log(`Socket.IO server initialized`);
  if (process.env.pm_id !== undefined) {
    console.log(`🟢 Executando sob PM2 (pm_id=${process.env.pm_id}) instâncias=${process.env.instances || '1'}`);
  } else {
    console.log('ℹ️ PM2 não detectado (executando diretamente via node / npm).');
  }
  
  // Inicializar Redis para sistema ultra leve
  console.log('🔥 Inicializando Redis para sistema ultra leve...');
  await RedisService.initialize();
  
  // Aguardar um pouco para o servidor estabilizar
  setTimeout(async () => {
    console.log('🚀 Iniciando sistemas automáticos...');
    
  // Reconectar sessões que estavam conectadas
  await autoReconnectSessions();

  // Iniciar verificação de saúde (execução a cada 5 min)
  startSessionHealthCheck();

    // Iniciar despachante de agendamentos
    try {
      const { startScheduleDispatcher } = await import('./services/scheduleDispatcher.js');
      startScheduleDispatcher();
      console.log('⏰ Dispatcher de agendamentos iniciado');
    } catch (e) {
      console.error('Erro ao iniciar dispatcher de agendamentos:', e);
    }
    
  }, 3000); // Aguardar 3 segundos
});

// Encerramento gracioso
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️ Recebido sinal ${signal}. Encerrando graciosamente...`);
  try {
    // Parar timers e schedulers primeiro
    try {
      const { stopScheduleDispatcher } = await import('./services/scheduleDispatcher.js');
      stopScheduleDispatcher();
      console.log('⏰ Dispatcher de agendamentos parado');
    } catch (e) {
      console.error('Erro ao parar dispatcher:', e.message);
    }
    
    try {
      const { stopSessionHealthCheck } = await import('./services/sessionManager.js');
      stopSessionHealthCheck();
      console.log('🏥 Health check das sessões parado');
    } catch (e) {
      console.error('Erro ao parar health check:', e.message);
    }
    
    await RedisService.disconnect();
    await sequelize.close();
  } catch (e) {
    console.error('Erro ao finalizar recursos:', e.message);
  }
  server.close(() => {
    console.log('Servidor HTTP fechado.');
    process.exit(0);
  });
  // Timeout de segurança
  setTimeout(() => process.exit(1), 10000).unref();
};
['SIGINT','SIGTERM'].forEach(sig => process.on(sig, () => gracefulShutdown(sig)));

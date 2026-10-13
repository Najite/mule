import express from 'express';
import cors from 'cors';
import { bankingRouter } from './routes/banking';
import { copilotRouter } from './routes/copilot';
import { graphRouter } from './routes/graph';
import { reportsRouter } from './routes/reports';
import { telemetryRouter } from './routes/telemetry';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Health Check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'finint-intelligence-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    features: {
      tarjanScc: 'O(V+E) Linear',
      finaclePnd: 'HMAC-SHA256 Authenticated',
      goAmlVersion: 'UNODC v5',
      llmCopilot: process.env.GEMINI_API_KEY ? 'Gemini 2.0 Flash' : 'Deterministic Rule Engine',
    },
  });
});

// API Routes
app.use('/api/v1/banking', bankingRouter);
app.use('/api/v1/copilot', copilotRouter);
app.use('/api/v1/graph', graphRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/telemetry', telemetryRouter);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`[FININT Backend] Intelligence Service listening on port ${PORT}`);
  console.log(`[FININT Backend] Health Endpoint: http://localhost:${PORT}/api/v1/health`);
});

export default app;
export { server };

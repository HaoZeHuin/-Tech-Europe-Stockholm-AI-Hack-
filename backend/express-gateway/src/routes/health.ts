import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint for the Express gateway
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'express-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * GET /api/health/services
 * Check health of all connected services
 */
router.get('/services', async (req: Request, res: Response) => {
  const services = {
    'express-gateway': {
      status: 'healthy',
      url: `http://localhost:${process.env.PORT || 3001}`,
      response_time_ms: 0
    },
    'n8n-service': {
      status: 'unknown',
      url: process.env.N8N_SERVICE_URL || 'http://localhost:8001',
      response_time_ms: 0,
      error: null as string | null
    },
    'rag-service': {
      status: 'unknown', 
      url: process.env.RAG_SERVICE_URL || 'http://localhost:8002',
      response_time_ms: 0,
      error: null as string | null
    }
  };

  // Check n8n service
  try {
    const startTime = Date.now();
    await axios.get(`${services['n8n-service'].url}/health`, { timeout: 5000 });
    services['n8n-service'].status = 'healthy';
    services['n8n-service'].response_time_ms = Date.now() - startTime;
  } catch (error) {
    services['n8n-service'].status = 'unhealthy';
    services['n8n-service'].error = error instanceof Error ? error.message : 'Unknown error';
  }

  // Check RAG service
  try {
    const startTime = Date.now();
    await axios.get(`${services['rag-service'].url}/health`, { timeout: 5000 });
    services['rag-service'].status = 'healthy';
    services['rag-service'].response_time_ms = Date.now() - startTime;
  } catch (error) {
    services['rag-service'].status = 'unhealthy';
    services['rag-service'].error = error instanceof Error ? error.message : 'Unknown error';
  }

  const allHealthy = Object.values(services).every(service => service.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    overall_status: allHealthy ? 'healthy' : 'degraded',
    services,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/health/openai
 * Check OpenAI API connectivity
 */
router.get('/openai', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Simple API test - list models
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    res.json({
      status: 'healthy',
      service: 'openai-api',
      response_time_ms: Date.now() - startTime,
      models_available: response.data.data.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OpenAI API health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      service: 'openai-api',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as healthRouter };

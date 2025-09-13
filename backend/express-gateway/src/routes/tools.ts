import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { toolRouter } from '../services/toolRouter';
import { ToolExecutionRequest } from '../types/tools';

const router = Router();

// Request validation schema
const ToolCallRequestSchema = z.object({
  name: z.string().min(1, 'Tool name is required'),
  parameters: z.record(z.any()).default({}),
  user_id: z.string().optional(),
  conversation_id: z.string().optional()
});

/**
 * POST /api/tools/execute
 * Execute a tool call and return the result
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedRequest = ToolCallRequestSchema.parse(req.body);
    
    console.log(`🔧 Executing tool: ${validatedRequest.name}`, {
      parameters: validatedRequest.parameters,
      user_id: validatedRequest.user_id
    });

    // Execute the tool
    const result = await toolRouter.executeToolCall(validatedRequest);
    
    // Log execution result
    console.log(`✅ Tool execution completed: ${validatedRequest.name}`, {
      success: result.success,
      execution_time: result.execution_time_ms,
      service: result.service_used
    });

    res.json(result);
    
  } catch (error) {
    console.error('Tool execution error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: error.errors,
        execution_time_ms: 0,
        service_used: 'direct'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: 0,
        service_used: 'direct'
      });
    }
  }
});

/**
 * GET /api/tools/available
 * List all available tools and their categories
 */
router.get('/available', (req: Request, res: Response) => {
  // Import tool definitions from shared contracts
  const { OPENAI_TOOLS } = require('../../shared/contracts/ToolDefs');
  const { TOOL_CATEGORIES } = require('../types/tools');
  
  res.json({
    success: true,
    data: {
      tools: OPENAI_TOOLS,
      categories: TOOL_CATEGORIES,
      services: {
        express_gateway: process.env.PORT || 3001,
        n8n_service: process.env.N8N_SERVICE_URL || 'http://localhost:8001',
        rag_service: process.env.RAG_SERVICE_URL || 'http://localhost:8002'
      }
    }
  });
});

/**
 * POST /api/tools/batch
 * Execute multiple tool calls in sequence
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { tools } = req.body;
    
    if (!Array.isArray(tools)) {
      return res.status(400).json({
        success: false,
        error: 'Request must contain an array of tools'
      });
    }

    const results = [];
    const startTime = Date.now();

    for (const toolRequest of tools) {
      const validatedRequest = ToolCallRequestSchema.parse(toolRequest);
      const result = await toolRouter.executeToolCall(validatedRequest);
      results.push({
        tool: validatedRequest.name,
        ...result
      });
    }

    res.json({
      success: true,
      results,
      total_execution_time_ms: Date.now() - startTime,
      tools_executed: results.length
    });

  } catch (error) {
    console.error('Batch tool execution error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as toolRouter };

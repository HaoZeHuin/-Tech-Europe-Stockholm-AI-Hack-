import { Router, Request, Response } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { toolRouter } from '../services/toolRouter';
// Import OPENAI_TOOLS from your shared contracts
const { OPENAI_TOOLS } = require('../../shared/contracts/ToolDefs');

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Request validation schemas
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversation_id: z.string().optional(),
  user_id: z.string().optional(),
  stream: z.boolean().default(false)
});

/**
 * POST /api/chat
 * Handle chat completion with tool calling support
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversation_id, user_id, stream } = ChatRequestSchema.parse(req.body);
    
    console.log(`💬 Chat request from user ${user_id || 'anonymous'}:`, message);

    // Import system prompts from your shared prompts
    const { JARVIS_CORE_PERSONALITY } = require('../../shared/prompts/system-prompts');

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: JARVIS_CORE_PERSONALITY
      },
      {
        role: 'user',
        content: message
      }
    ];

    if (stream) {
      // Handle streaming response
      const streamingResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        tools: OPENAI_TOOLS as any,
        tool_choice: 'auto',
        stream: true,
        temperature: 0.7
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of streamingResponse) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          res.write(`data: ${JSON.stringify({ type: 'content', data: delta.content })}\n\n`);
        }
        
        if (delta?.tool_calls) {
          // Handle tool calls in streaming mode
          for (const toolCall of delta.tool_calls) {
            if (toolCall.function?.name && toolCall.function?.arguments) {
              try {
                const toolResult = await toolRouter.executeToolCall({
                  name: toolCall.function.name,
                  parameters: JSON.parse(toolCall.function.arguments),
                  user_id,
                  conversation_id
                });
                
                res.write(`data: ${JSON.stringify({ 
                  type: 'tool_result', 
                  tool: toolCall.function.name,
                  data: toolResult 
                })}\n\n`);
              } catch (error) {
                res.write(`data: ${JSON.stringify({ 
                  type: 'tool_error', 
                  tool: toolCall.function.name,
                  error: error instanceof Error ? error.message : 'Tool execution failed'
                })}\n\n`);
              }
            }
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();

    } else {
      // Handle regular completion
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        tools: OPENAI_TOOLS as any,
        tool_choice: 'auto',
        temperature: 0.7
      });

      const choice = completion.choices[0];
      let finalResponse = choice.message.content || '';
      const toolResults: any[] = [];

      // Execute any tool calls
      if (choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          try {
            const toolResult = await toolRouter.executeToolCall({
              name: toolCall.function.name,
              parameters: JSON.parse(toolCall.function.arguments),
              user_id,
              conversation_id
            });

            toolResults.push({
              tool: toolCall.function.name,
              result: toolResult
            });

            // Add tool result to conversation and get final response
            const updatedMessages = [
              ...messages,
              choice.message,
              {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult)
              }
            ];

            const finalCompletion = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: updatedMessages,
              temperature: 0.7
            });

            finalResponse = finalCompletion.choices[0].message.content || finalResponse;

          } catch (error) {
            console.error(`Tool execution failed for ${toolCall.function.name}:`, error);
            toolResults.push({
              tool: toolCall.function.name,
              error: error instanceof Error ? error.message : 'Tool execution failed'
            });
          }
        }
      }

      res.json({
        success: true,
        response: finalResponse,
        tool_results: toolResults,
        conversation_id,
        usage: completion.usage
      });
    }

  } catch (error) {
    console.error('Chat completion error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * GET /api/chat/models
 * List available OpenAI models
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const models = await openai.models.list();
    res.json({
      success: true,
      models: models.data.filter(model => 
        model.id.includes('gpt') || model.id.includes('text-embedding')
      )
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch models'
    });
  }
});

export { router as chatRouter };

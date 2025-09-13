import axios from 'axios';
import { 
  ToolExecutionRequest, 
  ToolExecutionResponse, 
  TOOL_CATEGORIES,
  DirectTool,
  N8nTool,
  RagTool
} from '../types/tools';

export class ToolRouter {
  private n8nServiceUrl: string;
  private ragServiceUrl: string;

  constructor() {
    this.n8nServiceUrl = process.env.N8N_SERVICE_URL || 'http://localhost:8001';
    this.ragServiceUrl = process.env.RAG_SERVICE_URL || 'http://localhost:8002';
  }

  /**
   * Route tool execution to the appropriate service
   */
  async executeToolCall(request: ToolExecutionRequest): Promise<ToolExecutionResponse> {
    const startTime = Date.now();
    
    try {
      // Determine which service should handle this tool
      const category = this.getToolCategory(request.name);
      
      let result: any;
      let serviceUsed: ToolExecutionResponse['service_used'];

      switch (category) {
        case 'DIRECT':
          result = await this.executeDirectTool(request.name as DirectTool, request.parameters);
          serviceUsed = 'direct';
          break;
          
        case 'N8N_WORKFLOWS':
          result = await this.executeN8nTool(request.name as N8nTool, request.parameters);
          serviceUsed = 'n8n';
          break;
          
        case 'RAG_TOOLS':
          result = await this.executeRagTool(request.name as RagTool, request.parameters);
          serviceUsed = 'rag';
          break;
          
        default:
          throw new Error(`Unknown tool: ${request.name}`);
      }

      return {
        success: true,
        result,
        execution_time_ms: Date.now() - startTime,
        service_used: serviceUsed
      };

    } catch (error) {
      console.error(`Tool execution failed for ${request.name}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: Date.now() - startTime,
        service_used: 'direct' // fallback
      };
    }
  }

  /**
   * Determine which category a tool belongs to
   */
  private getToolCategory(toolName: string): keyof typeof TOOL_CATEGORIES | null {
    for (const [category, tools] of Object.entries(TOOL_CATEGORIES)) {
      if (tools.includes(toolName as any)) {
        return category as keyof typeof TOOL_CATEGORIES;
      }
    }
    return null;
  }

  /**
   * Execute tools directly in the Express gateway
   */
  private async executeDirectTool(toolName: DirectTool, parameters: any): Promise<any> {
    switch (toolName) {
      case 'note_append':
        return this.handleNoteAppend(parameters);
        
      case 'weather_lookup':
        return this.handleWeatherLookup(parameters);
        
      case 'maps_link':
        return this.handleMapsLink(parameters);
        
      default:
        throw new Error(`Direct tool not implemented: ${toolName}`);
    }
  }

  /**
   * Route tool execution to n8n service
   */
  private async executeN8nTool(toolName: N8nTool, parameters: any): Promise<any> {
    try {
      const response = await axios.post(`${this.n8nServiceUrl}/tools/${toolName}`, {
        parameters,
        timestamp: new Date().toISOString()
      }, {
        timeout: 30000, // 30 second timeout for n8n workflows
        headers: {
          'Content-Type': 'application/json',
          'X-Service': 'express-gateway'
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`n8n service error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Route tool execution to RAG service
   */
  private async executeRagTool(toolName: RagTool, parameters: any): Promise<any> {
    try {
      const response = await axios.post(`${this.ragServiceUrl}/tools/${toolName}`, {
        parameters,
        timestamp: new Date().toISOString()
      }, {
        timeout: 10000, // 10 second timeout for RAG queries
        headers: {
          'Content-Type': 'application/json',
          'X-Service': 'express-gateway'
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`RAG service error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  // Direct tool implementations
  private async handleNoteAppend(params: any) {
    // TODO: Implement direct note appending
    // This could write directly to filesystem or call a simple service
    return {
      success: true,
      message: "Note append not yet implemented in direct mode",
      path: params.path
    };
  }

  private async handleWeatherLookup(params: any) {
    // TODO: Implement weather API call
    return {
      success: true,
      message: "Weather lookup not yet implemented",
      location: params.location
    };
  }

  private async handleMapsLink(params: any) {
    // Generate Google Maps link directly
    const baseUrl = "https://maps.google.com/maps";
    const destination = encodeURIComponent(params.destination);
    const origin = params.origin ? encodeURIComponent(params.origin) : null;
    
    let url = `${baseUrl}?daddr=${destination}`;
    if (origin) {
      url += `&saddr=${origin}`;
    }
    
    if (params.mode && params.mode !== 'driving') {
      const modeMap = {
        walking: 'w',
        transit: 'r',
        bicycling: 'b'
      };
      url += `&dirflg=${modeMap[params.mode as keyof typeof modeMap] || ''}`;
    }

    return {
      success: true,
      url,
      destination: params.destination,
      origin: params.origin,
      mode: params.mode || 'driving'
    };
  }
}

// Export singleton instance
export const toolRouter = new ToolRouter();

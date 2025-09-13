import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log incoming request
  console.log(`[Request] ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    ...(Object.keys(req.body || {}).length > 0 && {
      bodyKeys: Object.keys(req.body)
    })
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    console.log(`[Request] ${req.method} ${req.path} - ${res.statusCode}`, {
      responseTime: `${responseTime}ms`,
      success: res.statusCode < 400,
      timestamp: new Date().toISOString()
    });

    return originalJson.call(this, body);
  };

  next();
};

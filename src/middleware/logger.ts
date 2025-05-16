import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Сохраняем время начала запроса
  const startTime = new Date();
  
  // Сохраняем оригинальный метод end
  const originalEnd = res.end;
  
  // Переопределяем метод end для перехвата статус кода
  res.end = function(chunk?: any, encoding?: any, callback?: any): Response {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    // Форматируем время в формате HH:MM:SS
    const timeString = endTime.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    console.log(
      `[${timeString}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
    
    // Вызываем оригинальный метод end
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
}; 
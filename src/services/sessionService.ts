
import { supabase } from '@/integrations/supabase/client';
import { TradingSession } from '@/types/session';
import { validateSessionData } from '@/utils/candleValidation';

// Кэш для сессий
const sessionCache = new Map<string, { data: TradingSession, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

// Utility функции
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL;
};

const retryOperation = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) break;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
};

export const sessionService = {
  async loadSessions(): Promise<TradingSession[]> {
    return retryOperation(async () => {
      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading sessions:', error);
        throw new Error(`Failed to load sessions: ${error.message}`);
      }
      
      // Обновляем кэш для каждой сессии
      data?.forEach(session => {
        sessionCache.set(session.id, {
          data: session,
          timestamp: Date.now()
        });
      });
      
      return data || [];
    });
  },

  async getSessionFromCache(sessionId: string): Promise<TradingSession | null> {
    const cached = sessionCache.get(sessionId);
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    return null;
  },

  async createSession(sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }): Promise<TradingSession> {
    // Валидация на фронтенде
    const validation = validateSessionData(sessionData);
    if (!validation.isValid) {
      throw new Error(`Validation errors: ${validation.errors.join(', ')}`);
    }

    return retryOperation(async () => {
      const { data, error } = await supabase
        .from('trading_sessions')
        .insert([{
          ...sessionData,
          current_candle_index: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw new Error(`Failed to create session: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from session creation');
      }
      
      // Кэшируем новую сессию
      sessionCache.set(data.id, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    });
  },

  async loadSessionWithCandles(sessionId: string) {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }

    // Проверяем кэш для сессии
    const cachedSession = await this.getSessionFromCache(sessionId);
    
    return retryOperation(async () => {
      const sessionPromise = cachedSession 
        ? Promise.resolve({ data: cachedSession, error: null })
        : supabase
            .from('trading_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

      const candlesPromise = supabase
        .from('candle_data')
        .select('*')
        .eq('session_id', sessionId)
        .order('candle_index', { ascending: true });

      const [sessionResult, candlesResult] = await Promise.all([
        sessionPromise,
        candlesPromise
      ]);

      if (sessionResult.error) {
        console.error('Error loading session:', sessionResult.error);
        throw new Error(`Failed to load session: ${sessionResult.error.message}`);
      }
      
      if (candlesResult.error) {
        console.error('Error loading candles:', candlesResult.error);
        throw new Error(`Failed to load candles: ${candlesResult.error.message}`);
      }
      
      if (!sessionResult.data) {
        throw new Error('Session not found');
      }

      // Кэшируем сессию если она не была кэширована
      if (!cachedSession) {
        sessionCache.set(sessionId, {
          data: sessionResult.data,
          timestamp: Date.now()
        });
      }

      return {
        session: sessionResult.data,
        candles: candlesResult.data || []
      };
    });
  },

  async updateSessionCandleIndex(sessionId: string, candleIndex: number): Promise<void> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }
    
    if (typeof candleIndex !== 'number' || candleIndex < 0) {
      throw new Error('Valid candle index is required');
    }

    return retryOperation(async () => {
      const { error } = await supabase
        .from('trading_sessions')
        .update({ 
          current_candle_index: candleIndex,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session candle index:', error);
        throw new Error(`Failed to update session: ${error.message}`);
      }
      
      // Обновляем кэш
      const cached = sessionCache.get(sessionId);
      if (cached) {
        cached.data.current_candle_index = candleIndex;
        cached.data.updated_at = new Date().toISOString();
        cached.timestamp = Date.now();
      }
    });
  },

  async deleteSession(sessionId: string): Promise<void> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }

    return retryOperation(async () => {
      // Каскадное удаление настроено в базе данных
      const { error } = await supabase
        .from('trading_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        throw new Error(`Failed to delete session: ${error.message}`);
      }
      
      // Удаляем из кэша
      sessionCache.delete(sessionId);
    });
  },

  async duplicateSession(sessionId: string, newName: string): Promise<TradingSession> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }
    
    if (!newName?.trim()) {
      throw new Error('New session name is required and cannot be empty');
    }

    // Сначала пробуем взять из кэша
    let originalSession = await this.getSessionFromCache(sessionId);
    
    if (!originalSession) {
      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching original session:', error);
        throw new Error(`Failed to fetch original session: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Original session not found');
      }
      
      originalSession = data;
    }

    const sessionData = {
      session_name: newName.trim(),
      pair: originalSession.pair,
      timeframe: originalSession.timeframe,
      start_date: originalSession.start_date,
      start_time: originalSession.start_time
    };

    return this.createSession(sessionData);
  },

  // Очистка кэша
  clearCache(): void {
    sessionCache.clear();
  },

  // Получение статистики кэша
  getCacheStats() {
    const now = Date.now();
    const validEntries = Array.from(sessionCache.values())
      .filter(entry => isCacheValid(entry.timestamp));
    
    return {
      totalEntries: sessionCache.size,
      validEntries: validEntries.length,
      invalidEntries: sessionCache.size - validEntries.length
    };
  }
};

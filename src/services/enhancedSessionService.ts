
import { supabase } from '@/integrations/supabase/client';
import { TradingSession } from '@/hooks/useTradingSession';

export const enhancedSessionService = {
  async loadSessions(): Promise<TradingSession[]> {
    try {
      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error loading sessions:', error);
        throw new Error(`Ошибка загрузки сессий: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in loadSessions:', error);
      throw error;
    }
  },

  async createSession(sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }): Promise<TradingSession> {
    if (!sessionData.session_name?.trim()) {
      throw new Error('Название сессии обязательно для заполнения');
    }

    if (!sessionData.pair?.trim()) {
      throw new Error('Валютная пара обязательна для заполнения');
    }

    try {
      const { data, error } = await supabase
        .from('trading_sessions')
        .insert([{
          ...sessionData,
          current_candle_index: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error creating session:', error);
        throw new Error(`Ошибка создания сессии: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error in createSession:', error);
      throw error;
    }
  },

  async loadSessionWithCandles(sessionId: string) {
    if (!sessionId?.trim()) {
      throw new Error('ID сессии обязателен');
    }

    try {
      const [sessionResult, candlesResult] = await Promise.all([
        supabase
          .from('trading_sessions')
          .select('*')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('candle_data')
          .select('*')
          .eq('session_id', sessionId)
          .order('candle_index', { ascending: true })
      ]);

      if (sessionResult.error) {
        console.error('Database error loading session:', sessionResult.error);
        throw new Error(`Ошибка загрузки сессии: ${sessionResult.error.message}`);
      }
      
      if (candlesResult.error) {
        console.error('Database error loading candles:', candlesResult.error);
        throw new Error(`Ошибка загрузки свечей: ${candlesResult.error.message}`);
      }

      return {
        session: sessionResult.data,
        candles: candlesResult.data || []
      };
    } catch (error) {
      console.error('Error in loadSessionWithCandles:', error);
      throw error;
    }
  },

  async updateSessionCandleIndex(sessionId: string, candleIndex: number): Promise<void> {
    if (!sessionId?.trim()) {
      throw new Error('ID сессии обязателен');
    }

    if (candleIndex < 0) {
      throw new Error('Индекс свечи не может быть отрицательным');
    }

    try {
      const { error } = await supabase
        .from('trading_sessions')
        .update({ current_candle_index: candleIndex })
        .eq('id', sessionId);

      if (error) {
        console.error('Database error updating session index:', error);
        throw new Error(`Ошибка обновления индекса: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateSessionCandleIndex:', error);
      throw error;
    }
  }
};

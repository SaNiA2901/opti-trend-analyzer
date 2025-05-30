
import { supabase } from '@/integrations/supabase/client';
import { TradingSession } from '@/hooks/useTradingSession';

export const sessionService = {
  async loadSessions(): Promise<TradingSession[]> {
    const { data, error } = await supabase
      .from('trading_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createSession(sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }): Promise<TradingSession> {
    if (!sessionData.session_name?.trim()) {
      throw new Error('Session name is required');
    }

    const { data, error } = await supabase
      .from('trading_sessions')
      .insert([{
        ...sessionData,
        current_candle_index: 0
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async loadSessionWithCandles(sessionId: string) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

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

    if (sessionResult.error) throw sessionResult.error;
    if (candlesResult.error) throw candlesResult.error;

    return {
      session: sessionResult.data,
      candles: candlesResult.data || []
    };
  },

  async updateSessionCandleIndex(sessionId: string, candleIndex: number): Promise<void> {
    const { error } = await supabase
      .from('trading_sessions')
      .update({ 
        current_candle_index: candleIndex,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async deleteSession(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    // Сначала удаляем все свечи сессии
    const { error: candlesError } = await supabase
      .from('candle_data')
      .delete()
      .eq('session_id', sessionId);

    if (candlesError) throw candlesError;

    // Затем удаляем саму сессию
    const { error: sessionError } = await supabase
      .from('trading_sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionError) throw sessionError;
  },

  async duplicateSession(sessionId: string, newName: string): Promise<TradingSession> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const { data: originalSession, error } = await supabase
      .from('trading_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;

    const { data: newSession, error: createError } = await supabase
      .from('trading_sessions')
      .insert([{
        session_name: newName,
        pair: originalSession.pair,
        timeframe: originalSession.timeframe,
        start_date: originalSession.start_date,
        start_time: originalSession.start_time,
        current_candle_index: 0
      }])
      .select()
      .single();

    if (createError) throw createError;
    return newSession;
  }
};

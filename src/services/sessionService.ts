
import { supabase } from '@/integrations/supabase/client';
import { TradingSession } from '@/hooks/useTradingSession';
import { validateSessionData } from '@/utils/candleValidation';

export const sessionService = {
  async loadSessions(): Promise<TradingSession[]> {
    const { data, error } = await supabase
      .from('trading_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
      throw new Error(`Failed to load sessions: ${error.message}`);
    }
    
    return data || [];
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
    
    return data;
  },

  async loadSessionWithCandles(sessionId: string) {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
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

    return {
      session: sessionResult.data,
      candles: candlesResult.data || []
    };
  },

  async updateSessionCandleIndex(sessionId: string, candleIndex: number): Promise<void> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }
    
    if (typeof candleIndex !== 'number' || candleIndex < 0) {
      throw new Error('Valid candle index is required');
    }

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
  },

  async deleteSession(sessionId: string): Promise<void> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }

    // Каскадное удаление настроено в базе данных
    const { error } = await supabase
      .from('trading_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  },

  async duplicateSession(sessionId: string, newName: string): Promise<TradingSession> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }
    
    if (!newName?.trim()) {
      throw new Error('New session name is required and cannot be empty');
    }

    const { data: originalSession, error } = await supabase
      .from('trading_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching original session:', error);
      throw new Error(`Failed to fetch original session: ${error.message}`);
    }
    
    if (!originalSession) {
      throw new Error('Original session not found');
    }

    const sessionData = {
      session_name: newName.trim(),
      pair: originalSession.pair,
      timeframe: originalSession.timeframe,
      start_date: originalSession.start_date,
      start_time: originalSession.start_time
    };

    return this.createSession(sessionData);
  }
};

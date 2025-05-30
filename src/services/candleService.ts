
import { supabase } from '@/integrations/supabase/client';
import { CandleData } from '@/hooks/useTradingSession';

export const candleService = {
  async saveCandle(candleData: Omit<CandleData, 'id'>): Promise<CandleData> {
    const { data, error } = await supabase
      .from('candle_data')
      .upsert([candleData], { 
        onConflict: 'session_id,candle_index',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCandlesForSession(sessionId: string): Promise<CandleData[]> {
    const { data, error } = await supabase
      .from('candle_data')
      .select('*')
      .eq('session_id', sessionId)
      .order('candle_index', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async deleteCandle(sessionId: string, candleIndex: number): Promise<void> {
    const { error } = await supabase
      .from('candle_data')
      .delete()
      .eq('session_id', sessionId)
      .eq('candle_index', candleIndex);

    if (error) throw error;
  },

  async updateCandle(sessionId: string, candleIndex: number, updatedData: Partial<CandleData>): Promise<CandleData> {
    const { data, error } = await supabase
      .from('candle_data')
      .update(updatedData)
      .eq('session_id', sessionId)
      .eq('candle_index', candleIndex)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCandleByIndex(sessionId: string, candleIndex: number): Promise<CandleData | null> {
    const { data, error } = await supabase
      .from('candle_data')
      .select('*')
      .eq('session_id', sessionId)
      .eq('candle_index', candleIndex)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getLatestCandles(sessionId: string, limit: number = 10): Promise<CandleData[]> {
    const { data, error } = await supabase
      .from('candle_data')
      .select('*')
      .eq('session_id', sessionId)
      .order('candle_index', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).reverse(); // Возвращаем в правильном порядке
  }
};

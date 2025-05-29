
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
  }
};

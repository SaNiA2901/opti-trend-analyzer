
import { supabase } from '@/integrations/supabase/client';
import { CandleData } from '@/hooks/useTradingSession';

export const candleService = {
  async saveCandle(candleData: Omit<CandleData, 'id'>): Promise<CandleData> {
    // Проверяем обязательные поля
    if (!candleData.session_id) {
      throw new Error('Session ID is required for saving candle data');
    }

    if (typeof candleData.candle_index !== 'number' || candleData.candle_index < 0) {
      throw new Error('Valid candle index is required');
    }

    const { data, error } = await supabase
      .from('candle_data')
      .upsert([candleData], { 
        onConflict: 'session_id,candle_index',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving candle:', error);
      throw new Error(`Failed to save candle: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from candle save operation');
    }
    
    return data;
  },

  async getCandlesForSession(sessionId: string): Promise<CandleData[]> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }

    const { data, error } = await supabase
      .from('candle_data')
      .select('*')
      .eq('session_id', sessionId)
      .order('candle_index', { ascending: true });

    if (error) {
      console.error('Error fetching candles:', error);
      throw new Error(`Failed to fetch candles: ${error.message}`);
    }
    
    return data || [];
  },

  async deleteCandle(sessionId: string, candleIndex: number): Promise<void> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }
    
    if (typeof candleIndex !== 'number' || candleIndex < 0) {
      throw new Error('Valid candle index is required');
    }

    const { error } = await supabase
      .from('candle_data')
      .delete()
      .eq('session_id', sessionId)
      .eq('candle_index', candleIndex);

    if (error) {
      console.error('Error deleting candle:', error);
      throw new Error(`Failed to delete candle: ${error.message}`);
    }
  },

  async updateCandle(sessionId: string, candleIndex: number, updatedData: Partial<CandleData>): Promise<CandleData> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }
    
    if (typeof candleIndex !== 'number' || candleIndex < 0) {
      throw new Error('Valid candle index is required');
    }

    if (!updatedData || Object.keys(updatedData).length === 0) {
      throw new Error('Updated data is required');
    }

    const { data, error } = await supabase
      .from('candle_data')
      .update(updatedData)
      .eq('session_id', sessionId)
      .eq('candle_index', candleIndex)
      .select()
      .single();

    if (error) {
      console.error('Error updating candle:', error);
      throw new Error(`Failed to update candle: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from candle update operation');
    }
    
    return data;
  },

  async getCandleByIndex(sessionId: string, candleIndex: number): Promise<CandleData | null> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }
    
    if (typeof candleIndex !== 'number' || candleIndex < 0) {
      throw new Error('Valid candle index is required');
    }

    const { data, error } = await supabase
      .from('candle_data')
      .select('*')
      .eq('session_id', sessionId)
      .eq('candle_index', candleIndex)
      .maybeSingle();

    if (error) {
      console.error('Error fetching candle by index:', error);
      throw new Error(`Failed to fetch candle: ${error.message}`);
    }
    
    return data;
  },

  async getLatestCandles(sessionId: string, limit: number = 10): Promise<CandleData[]> {
    if (!sessionId?.trim()) {
      throw new Error('Session ID is required and cannot be empty');
    }
    
    if (typeof limit !== 'number' || limit <= 0) {
      throw new Error('Valid limit is required');
    }

    const { data, error } = await supabase
      .from('candle_data')
      .select('*')
      .eq('session_id', sessionId)
      .order('candle_index', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching latest candles:', error);
      throw new Error(`Failed to fetch latest candles: ${error.message}`);
    }
    
    return (data || []).reverse(); // Возвращаем в правильном порядке
  }
};

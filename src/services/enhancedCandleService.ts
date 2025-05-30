
import { supabase } from '@/integrations/supabase/client';
import { CandleData } from '@/hooks/useTradingSession';

export const enhancedCandleService = {
  async saveCandle(candleData: Omit<CandleData, 'id'>): Promise<CandleData> {
    try {
      const { data, error } = await supabase
        .from('candle_data')
        .upsert([candleData], { 
          onConflict: 'session_id,candle_index',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Database error saving candle:', error);
        throw new Error(`Ошибка сохранения в БД: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error in saveCandle:', error);
      throw error;
    }
  },

  async getCandlesForSession(sessionId: string): Promise<CandleData[]> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    try {
      const { data, error } = await supabase
        .from('candle_data')
        .select('*')
        .eq('session_id', sessionId)
        .order('candle_index', { ascending: true });

      if (error) {
        console.error('Database error loading candles:', error);
        throw new Error(`Ошибка загрузки свечей: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCandlesForSession:', error);
      throw error;
    }
  },

  async updateCandlePrediction(
    candleId: string, 
    prediction: {
      direction: string;
      probability: number;
      confidence: number;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('candle_data')
        .update({
          prediction_direction: prediction.direction,
          prediction_probability: prediction.probability,
          prediction_confidence: prediction.confidence
        })
        .eq('id', candleId);

      if (error) {
        console.error('Database error updating prediction:', error);
        throw new Error(`Ошибка обновления прогноза: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateCandlePrediction:', error);
      throw error;
    }
  }
};

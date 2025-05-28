
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TradingSession {
  id: string;
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
  current_candle_index: number;
  created_at: string;
  updated_at: string;
}

export interface CandleData {
  id?: string;
  session_id: string;
  candle_index: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  candle_datetime: string;
  prediction_direction?: string;
  prediction_probability?: number;
  prediction_confidence?: number;
}

export const useTradingSession = () => {
  const [currentSession, setCurrentSession] = useState<TradingSession | null>(null);
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
      console.log('Sessions loaded:', data?.length || 0);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }) => {
    if (!sessionData.session_name?.trim()) {
      throw new Error('Session name is required');
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trading_sessions')
        .insert([{
          ...sessionData,
          current_candle_index: 0
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSession(data);
      setCandles([]);
      await loadSessions();
      console.log('Session created and set as current:', data);
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    setIsLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: candlesData, error: candlesError } = await supabase
        .from('candle_data')
        .select('*')
        .eq('session_id', sessionId)
        .order('candle_index', { ascending: true });

      if (candlesError) throw candlesError;

      setCurrentSession(sessionData);
      setCandles(candlesData || []);
      console.log('Session loaded:', sessionData);
      console.log('Candles loaded:', candlesData?.length || 0);
    } catch (error) {
      console.error('Error loading session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCandleTime = (startDate: string, startTime: string, timeframe: string, candleIndex: number): string => {
    if (!startDate || !startTime || !timeframe || candleIndex < 0) {
      throw new Error('Invalid parameters for candle time calculation');
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    
    if (isNaN(startDateTime.getTime())) {
      throw new Error('Invalid start date/time format');
    }
    
    const timeframeMinutes: { [key: string]: number } = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };

    const minutes = timeframeMinutes[timeframe];
    if (!minutes) {
      throw new Error(`Unsupported timeframe: ${timeframe}`);
    }

    const candleTime = new Date(startDateTime.getTime() + (candleIndex * minutes * 60 * 1000));
    return candleTime.toISOString();
  };

  const validateCandleData = (candleData: Omit<CandleData, 'id' | 'candle_datetime'>): string[] => {
    const errors: string[] = [];
    
    if (!candleData.session_id) errors.push('Session ID is required');
    if (candleData.candle_index < 0) errors.push('Candle index must be non-negative');
    if (candleData.open <= 0) errors.push('Open price must be positive');
    if (candleData.high <= 0) errors.push('High price must be positive');
    if (candleData.low <= 0) errors.push('Low price must be positive');
    if (candleData.close <= 0) errors.push('Close price must be positive');
    if (candleData.volume < 0) errors.push('Volume must be non-negative');
    
    if (candleData.high < Math.max(candleData.open, candleData.close)) {
      errors.push('High must be >= max(open, close)');
    }
    if (candleData.low > Math.min(candleData.open, candleData.close)) {
      errors.push('Low must be <= min(open, close)');
    }
    
    return errors;
  };

  const saveCandle = async (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    const validationErrors = validateCandleData(candleData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
    }

    try {
      const candleDateTime = calculateCandleTime(
        currentSession.start_date,
        currentSession.start_time,
        currentSession.timeframe,
        candleData.candle_index
      );

      const fullCandleData = {
        ...candleData,
        candle_datetime: candleDateTime
      };

      const { data, error } = await supabase
        .from('candle_data')
        .upsert([fullCandleData], { 
          onConflict: 'session_id,candle_index',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;

      const newCandleIndex = Math.max(currentSession.current_candle_index, candleData.candle_index);
      
      const { error: updateError } = await supabase
        .from('trading_sessions')
        .update({ current_candle_index: newCandleIndex })
        .eq('id', currentSession.id);

      if (updateError) throw updateError;

      setCandles(prev => {
        const filtered = prev.filter(c => c.candle_index !== candleData.candle_index);
        return [...filtered, data].sort((a, b) => a.candle_index - b.candle_index);
      });

      setCurrentSession(prev => prev ? {
        ...prev,
        current_candle_index: newCandleIndex
      } : null);

      console.log('Candle saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Error saving candle:', error);
      throw error;
    }
  };

  const getNextCandleTime = (candleIndex: number): string => {
    if (!currentSession) return '';
    
    try {
      return calculateCandleTime(
        currentSession.start_date,
        currentSession.start_time,
        currentSession.timeframe,
        candleIndex
      );
    } catch (error) {
      console.error('Error calculating next candle time:', error);
      return '';
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return {
    currentSession,
    sessions,
    candles,
    isLoading,
    createSession,
    loadSession,
    saveCandle,
    getNextCandleTime,
    loadSessions
  };
};

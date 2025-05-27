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

  // Загрузка всех сессий
  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trading_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Создание новой сессии
  const createSession = async (sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('trading_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;
      
      // Устанавливаем созданную сессию как текущую
      setCurrentSession(data);
      setCandles([]);
      await loadSessions();
      console.log('Created and set current session:', data);
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  };

  // Загрузка сессии
  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      // Загружаем информацию о сессии
      const { data: sessionData, error: sessionError } = await supabase
        .from('trading_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Загружаем свечи для этой сессии
      const { data: candlesData, error: candlesError } = await supabase
        .from('candle_data')
        .select('*')
        .eq('session_id', sessionId)
        .order('candle_index', { ascending: true });

      if (candlesError) throw candlesError;

      // Устанавливаем загруженную сессию как текущую
      setCurrentSession(sessionData);
      setCandles(candlesData || []);
      console.log('Loaded and set current session:', sessionData);
      console.log('Loaded candles:', candlesData);
    } catch (error) {
      console.error('Error loading session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для расчета времени свечи
  const calculateCandleTime = (startDate: string, startTime: string, timeframe: string, candleIndex: number): string => {
    const startDateTime = new Date(`${startDate}T${startTime}`);
    
    const timeframeMinutes: { [key: string]: number } = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };

    const minutes = timeframeMinutes[timeframe] || 60;
    const candleTime = new Date(startDateTime.getTime() + (candleIndex * minutes * 60 * 1000));
    
    return candleTime.toISOString();
  };

  // Сохранение свечи
  const saveCandle = async (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => {
    if (!currentSession) return;

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

      // Сохраняем или обновляем свечу
      const { data, error } = await supabase
        .from('candle_data')
        .upsert([fullCandleData], { 
          onConflict: 'session_id,candle_index',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;

      // Обновляем текущий индекс свечи в сессии
      await supabase
        .from('trading_sessions')
        .update({ current_candle_index: Math.max(currentSession.current_candle_index, candleData.candle_index) })
        .eq('id', currentSession.id);

      // Обновляем локальное состояние
      setCandles(prev => {
        const updated = prev.filter(c => c.candle_index !== candleData.candle_index);
        return [...updated, data].sort((a, b) => a.candle_index - b.candle_index);
      });

      setCurrentSession(prev => prev ? {
        ...prev,
        current_candle_index: Math.max(prev.current_candle_index, candleData.candle_index)
      } : null);

      return data;
    } catch (error) {
      console.error('Error saving candle:', error);
      throw error;
    }
  };

  // Получение следующего времени свечи
  const getNextCandleTime = (candleIndex: number): string => {
    if (!currentSession) return '';
    
    return calculateCandleTime(
      currentSession.start_date,
      currentSession.start_time,
      currentSession.timeframe,
      candleIndex
    );
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

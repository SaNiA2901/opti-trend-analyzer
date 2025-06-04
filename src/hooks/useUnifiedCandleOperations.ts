
import { useCallback } from 'react';
import { candleService } from '@/services/candleService';
import { sessionService } from '@/services/sessionService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { TradingSession, CandleData } from '@/types/session';

export const useUnifiedCandleOperations = (
  currentSession: TradingSession | null,
  candles: CandleData[],
  setCandles: (candles: CandleData[]) => void,
  setCurrentSession: (session: TradingSession | null) => void
) => {
  const { addError } = useErrorHandler();

  // Вычисление времени свечи
  const calculateCandleTime = useCallback((candleIndex: number) => {
    if (!currentSession) return '';
    
    try {
      const startDateTime = new Date(`${currentSession.start_date}T${currentSession.start_time}`);
      const timeframe = currentSession.timeframe;
      
      let minutes = 0;
      switch (timeframe) {
        case '1m': minutes = 1; break;
        case '5m': minutes = 5; break;
        case '15m': minutes = 15; break;
        case '30m': minutes = 30; break;
        case '1h': minutes = 60; break;
        case '4h': minutes = 240; break;
        case '1d': minutes = 1440; break;
        default: minutes = 60;
      }
      
      const candleDateTime = new Date(startDateTime.getTime() + (candleIndex * minutes * 60 * 1000));
      return candleDateTime.toISOString();
    } catch (error) {
      console.error('Error calculating candle time:', error);
      return '';
    }
  }, [currentSession]);

  // Сохранение новой свечи
  const saveCandle = useCallback(async (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
    }

    try {
      // Вычисляем время свечи
      const candleDateTime = calculateCandleTime(candleData.candle_index);
      
      // Создаем полные данные свечи
      const fullCandleData = {
        ...candleData,
        candle_datetime: candleDateTime
      };

      const savedCandle = await candleService.saveCandle(fullCandleData);
      
      // Обновляем список свечей
      setCandles([...candles, savedCandle]);
      
      // Обновляем индекс текущей свечи в сессии
      const updatedSession = {
        ...currentSession,
        current_candle_index: candleData.candle_index
      };
      setCurrentSession(updatedSession);
      
      await sessionService.updateSessionCandleIndex(
        currentSession.id, 
        candleData.candle_index
      );
      
      console.log('Candle saved:', savedCandle.id);
      return savedCandle;
    } catch (error) {
      console.error('Failed to save candle:', error);
      addError('Ошибка сохранения свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, candles, setCandles, setCurrentSession, calculateCandleTime, addError]);

  // Удаление последней свечи
  const deleteLastCandle = useCallback(async () => {
    if (!currentSession || candles.length === 0) {
      return;
    }

    const lastCandle = candles[candles.length - 1];
    
    try {
      await candleService.deleteCandle(currentSession.id, lastCandle.candle_index);
      
      // Удаляем свечу из списка
      const updatedCandles = candles.filter(c => c.id !== lastCandle.id);
      setCandles(updatedCandles);
      
      console.log('Last candle deleted:', lastCandle.id);
    } catch (error) {
      console.error('Failed to delete last candle:', error);
      addError('Ошибка удаления свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, candles, setCandles, addError]);

  return {
    saveCandle,
    deleteLastCandle,
    calculateCandleTime
  };
};

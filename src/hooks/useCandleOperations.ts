
import { useCallback } from 'react';
import { candleService } from '@/services/candleService';
import { sessionService } from '@/services/sessionService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { CandleData, TradingSession } from './useSessionState';

export const useCandleOperations = (
  currentSession: TradingSession | null,
  candles: CandleData[],
  setCandles: (candles: CandleData[]) => void
) => {
  const { addError } = useErrorHandler();

  // Сохранение новой свечи
  const saveCandle = useCallback(async (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
    }

    try {
      const savedCandle = await candleService.saveCandle(candleData);
      
      // Обновляем список свечей
      setCandles([...candles, savedCandle]);
      
      // Обновляем индекс текущей свечи в сессии
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
  }, [currentSession, candles, setCandles, addError]);

  // Удаление последней свечи
  const deleteLastCandle = useCallback(async () => {
    if (!currentSession || candles.length === 0) {
      return;
    }

    const lastCandle = candles[candles.length - 1];
    
    try {
      await candleService.deleteCandle(lastCandle.candle_index, currentSession.id);
      
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

  // Получение времени следующей свечи
  const getNextCandleTime = useCallback((candleIndex: number) => {
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
      
      const nextDateTime = new Date(startDateTime.getTime() + (candleIndex * minutes * 60 * 1000));
      return nextDateTime.toISOString();
    } catch (error) {
      console.error('Error calculating next candle time:', error);
      return '';
    }
  }, [currentSession]);

  return {
    saveCandle,
    deleteLastCandle,
    getNextCandleTime
  };
};

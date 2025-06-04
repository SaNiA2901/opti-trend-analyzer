
import { useCallback } from 'react';
import { candleService } from '@/services/candleService';
import { sessionService } from '@/services/sessionService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { TradingSession, CandleData } from '@/types/session';

export const useCandleManagement = (
  currentSession: TradingSession | null,
  updateCandles: (updater: (prev: CandleData[]) => CandleData[]) => void,
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

  // Сохранение новой свечи с валидацией
  const saveCandle = useCallback(async (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
    }

    // Валидация данных
    if (typeof candleData.candle_index !== 'number' || candleData.candle_index < 0) {
      throw new Error('Некорректный индекс свечи');
    }

    const { open, high, low, close, volume } = candleData;
    if (high < Math.max(open, close) || high < low) {
      throw new Error('Максимальная цена должна быть выше или равна цене открытия, закрытия и минимуму');
    }
    if (low > Math.min(open, close) || low > high) {
      throw new Error('Минимальная цена должна быть ниже или равна цене открытия, закрытия и максимуму');
    }
    if (volume <= 0) {
      throw new Error('Объем должен быть положительным числом');
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
      
      // Обновляем список свечей иммутабельно
      updateCandles(prev => {
        const filtered = prev.filter(c => c.candle_index !== candleData.candle_index);
        return [...filtered, savedCandle].sort((a, b) => a.candle_index - b.candle_index);
      });
      
      // Обновляем индекс текущей свечи в сессии
      const updatedSession = {
        ...currentSession,
        current_candle_index: Math.max(currentSession.current_candle_index, candleData.candle_index)
      };
      setCurrentSession(updatedSession);
      
      await sessionService.updateSessionCandleIndex(
        currentSession.id, 
        updatedSession.current_candle_index
      );
      
      console.log('Candle saved:', savedCandle.id);
      return savedCandle;
    } catch (error) {
      console.error('Failed to save candle:', error);
      addError('Ошибка сохранения свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, updateCandles, setCurrentSession, calculateCandleTime, addError]);

  // Удаление последней свечи
  const deleteLastCandle = useCallback(async (candles: CandleData[]) => {
    if (!currentSession || candles.length === 0) {
      return;
    }

    const lastCandle = candles[candles.length - 1];
    
    try {
      await candleService.deleteCandle(currentSession.id, lastCandle.candle_index);
      
      // Удаляем свечу из списка
      updateCandles(prev => prev.filter(c => c.id !== lastCandle.id));
      
      console.log('Last candle deleted:', lastCandle.id);
    } catch (error) {
      console.error('Failed to delete last candle:', error);
      addError('Ошибка удаления свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, updateCandles, addError]);

  // Обновление свечи
  const updateCandle = useCallback(async (candleIndex: number, updatedData: Partial<CandleData>) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
    }
    
    if (typeof candleIndex !== 'number' || candleIndex < 0) {
      throw new Error('Некорректный индекс свечи для обновления');
    }
    
    if (!updatedData || Object.keys(updatedData).length === 0) {
      throw new Error('Нет данных для обновления');
    }

    try {
      const updatedCandle = await candleService.updateCandle(currentSession.id, candleIndex, updatedData);

      if (updatedCandle) {
        updateCandles(prev => prev.map(c => 
          c.candle_index === candleIndex ? updatedCandle : c
        ));
        console.log('Candle updated successfully:', candleIndex);
        return updatedCandle;
      }
    } catch (error) {
      console.error('Error updating candle:', error);
      addError('Ошибка обновления свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, updateCandles, addError]);

  return {
    saveCandle,
    deleteLastCandle,
    updateCandle,
    calculateCandleTime
  };
};

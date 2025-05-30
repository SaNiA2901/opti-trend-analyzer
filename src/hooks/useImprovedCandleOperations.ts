
import { useCallback } from 'react';
import { candleService } from '@/services/candleService';
import { sessionService } from '@/services/sessionService';
import { calculateCandleDateTime } from '@/utils/dateTimeUtils';
import { validateCandleData } from '@/utils/candleValidation';
import { useErrorHandler } from './useErrorHandler';
import { TradingSession, CandleData } from './useTradingSession';

export const useImprovedCandleOperations = (
  currentSession: TradingSession | null,
  setCandles: (updater: (prev: CandleData[]) => CandleData[]) => void,
  setCurrentSession: (updater: (prev: TradingSession | null) => TradingSession | null) => void
) => {
  const { handleAsyncError, withErrorBoundary } = useErrorHandler();

  const saveCandle = useCallback(async (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии для сохранения данных');
    }

    // Валидация данных свечи
    const validation = validateCandleData(candleData);
    if (!validation.isValid) {
      throw new Error(`Ошибки валидации: ${validation.errors.join(', ')}`);
    }

    try {
      const candleDateTime = calculateCandleDateTime(
        currentSession.start_date,
        currentSession.start_time,
        currentSession.timeframe,
        candleData.candle_index
      );

      const fullCandleData = {
        ...candleData,
        candle_datetime: candleDateTime
      };

      console.log('Saving candle data:', fullCandleData);
      const savedCandle = await handleAsyncError(
        () => candleService.saveCandle(fullCandleData),
        'Ошибка сохранения свечи в базе данных'
      );

      if (!savedCandle) {
        throw new Error('Не удалось сохранить свечу');
      }

      const newCandleIndex = Math.max(currentSession.current_candle_index, candleData.candle_index);
      
      await handleAsyncError(
        () => sessionService.updateSessionCandleIndex(currentSession.id, newCandleIndex),
        'Ошибка обновления индекса сессии'
      );

      // Обновляем локальное состояние
      setCandles(prev => {
        const filtered = prev.filter(c => c.candle_index !== candleData.candle_index);
        return [...filtered, savedCandle].sort((a, b) => a.candle_index - b.candle_index);
      });

      setCurrentSession(prev => prev ? {
        ...prev,
        current_candle_index: newCandleIndex,
        updated_at: new Date().toISOString()
      } : null);

      return savedCandle;
    } catch (error) {
      console.error('Error in saveCandle:', error);
      throw error;
    }
  }, [currentSession, setCandles, setCurrentSession, handleAsyncError]);

  const getNextCandleTime = useCallback((candleIndex: number): string => {
    if (!currentSession) return '';
    
    const result = withErrorBoundary(() => {
      return calculateCandleDateTime(
        currentSession.start_date,
        currentSession.start_time,
        currentSession.timeframe,
        candleIndex
      );
    }, 'Ошибка расчета времени свечи');
    
    return result || '';
  }, [currentSession, withErrorBoundary]);

  const deleteCandle = useCallback(async (candleIndex: number) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
    }

    try {
      await handleAsyncError(
        () => candleService.deleteCandle(currentSession.id, candleIndex),
        'Ошибка удаления свечи'
      );

      setCandles(prev => prev.filter(c => c.candle_index !== candleIndex));
      console.log('Candle deleted successfully:', candleIndex);
    } catch (error) {
      console.error('Error deleting candle:', error);
      throw error;
    }
  }, [currentSession, setCandles, handleAsyncError]);

  const updateCandle = useCallback(async (candleIndex: number, updatedData: Partial<CandleData>) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
    }

    try {
      const updatedCandle = await handleAsyncError(
        () => candleService.updateCandle(currentSession.id, candleIndex, updatedData),
        'Ошибка обновления свечи'
      );

      if (updatedCandle) {
        setCandles(prev => prev.map(c => 
          c.candle_index === candleIndex ? updatedCandle : c
        ));
        console.log('Candle updated successfully:', candleIndex);
        return updatedCandle;
      }
    } catch (error) {
      console.error('Error updating candle:', error);
      throw error;
    }
  }, [currentSession, setCandles, handleAsyncError]);

  return {
    saveCandle,
    getNextCandleTime,
    deleteCandle,
    updateCandle
  };
};

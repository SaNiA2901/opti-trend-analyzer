
import { useCallback } from 'react';
import { candleService } from '@/services/candleService';
import { calculateCandleDateTime } from '@/utils/dateTimeUtils';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { TradingSession, CandleData } from '@/hooks/useTradingSession';

export const useCandleOperations = (
  currentSession: TradingSession | null,
  setCandles: (updater: (prev: CandleData[]) => CandleData[]) => void
) => {
  const { handleAsyncError, addError } = useErrorHandler();

  const getNextCandleTime = useCallback((candleIndex: number): string => {
    if (!currentSession) {
      console.warn('No current session available for time calculation');
      return '';
    }
    
    if (typeof candleIndex !== 'number' || candleIndex < 0) {
      addError('Некорректный индекс свечи для расчета времени', undefined, { source: 'candle-operations' });
      return '';
    }
    
    try {
      return calculateCandleDateTime(
        currentSession.start_date,
        currentSession.start_time,
        currentSession.timeframe,
        candleIndex
      );
    } catch (error) {
      console.error('Error calculating candle time:', error);
      addError('Ошибка расчета времени свечи', undefined, { source: 'candle-operations' });
      return '';
    }
  }, [currentSession, addError]);

  const deleteCandle = useCallback(async (candleIndex: number) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
    }
    
    if (typeof candleIndex !== 'number' || candleIndex < 0) {
      throw new Error('Некорректный индекс свечи для удаления');
    }

    try {
      await handleAsyncError(
        () => candleService.deleteCandle(currentSession.id, candleIndex),
        'Ошибка удаления свечи',
        { source: 'candle-operations' }
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
    
    if (typeof candleIndex !== 'number' || candleIndex < 0) {
      throw new Error('Некорректный индекс свечи для обновления');
    }
    
    if (!updatedData || Object.keys(updatedData).length === 0) {
      throw new Error('Нет данных для обновления');
    }

    try {
      const updatedCandle = await handleAsyncError(
        () => candleService.updateCandle(currentSession.id, candleIndex, updatedData),
        'Ошибка обновления свечи',
        { source: 'candle-operations' }
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
    getNextCandleTime,
    deleteCandle,
    updateCandle
  };
};

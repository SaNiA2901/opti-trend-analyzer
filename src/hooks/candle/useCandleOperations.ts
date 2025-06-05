
import { useCallback } from 'react';
import { candleService } from '@/services/candleService';
import { sessionService } from '@/services/sessionService';
import { calculateCandleDateTime } from '@/utils/dateTimeUtils';
import { validateCandleData } from '@/utils/candleValidation';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { TradingSession, CandleData } from '@/types/session';

export const useCandleOperations = (
  currentSession: TradingSession | null,
  updateCandles: (updater: (prev: CandleData[]) => CandleData[]) => void,
  setCurrentSession: (session: TradingSession | null) => void
) => {
  const { addError } = useErrorHandler();

  const saveCandle = useCallback(async (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии для сохранения данных');
    }

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
      const savedCandle = await candleService.saveCandle(fullCandleData);

      if (!savedCandle) {
        throw new Error('Не удалось сохранить свечу');
      }

      const newCandleIndex = Math.max(currentSession.current_candle_index, candleData.candle_index);
      
      await sessionService.updateSessionCandleIndex(currentSession.id, newCandleIndex);

      updateCandles(prev => {
        const filtered = prev.filter(c => c.candle_index !== candleData.candle_index);
        return [...filtered, savedCandle].sort((a, b) => a.candle_index - b.candle_index);
      });

      setCurrentSession({
        ...currentSession,
        current_candle_index: newCandleIndex,
        updated_at: new Date().toISOString()
      });

      return savedCandle;
    } catch (error) {
      console.error('Error in saveCandle:', error);
      addError('Ошибка сохранения свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, updateCandles, setCurrentSession, addError]);

  const deleteCandle = useCallback(async (candleIndex: number) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
    }
    
    try {
      await candleService.deleteCandle(currentSession.id, candleIndex);
      updateCandles(prev => prev.filter(c => c.candle_index !== candleIndex));
      console.log('Candle deleted successfully:', candleIndex);
    } catch (error) {
      console.error('Error deleting candle:', error);
      addError('Ошибка удаления свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, updateCandles, addError]);

  const updateCandle = useCallback(async (candleIndex: number, updatedData: Partial<CandleData>) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
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
    deleteCandle,
    updateCandle
  };
};

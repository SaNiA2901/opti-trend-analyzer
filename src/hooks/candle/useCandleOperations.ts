
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

      // ИСПРАВЛЕНИЕ: Сначала обновляем локальное состояние свечей
      updateCandles(prev => {
        const filtered = prev.filter(c => c.candle_index !== candleData.candle_index);
        const newCandles = [...filtered, savedCandle].sort((a, b) => a.candle_index - b.candle_index);
        
        console.log(`🕯️ Обновлено свечей: ${prev.length} -> ${newCandles.length}`);
        return newCandles;
      });

      // ИСПРАВЛЕНИЕ: Вычисляем правильный индекс на основе реальных данных
      const newCandleIndex = Math.max(
        currentSession.current_candle_index, 
        candleData.candle_index
      );
      
      // Обновляем индекс в БД
      await sessionService.updateSessionCandleIndex(currentSession.id, newCandleIndex);

      // ИСПРАВЛЕНИЕ: Синхронизируем данные сессии после сохранения
      try {
        const syncResult = await sessionService.syncSessionData(currentSession.id);
        console.log(`📊 Синхронизация: индекс=${syncResult.session.current_candle_index}, свечей=${syncResult.actualCandleCount}`);
        
        setCurrentSession({
          ...syncResult.session,
          updated_at: new Date().toISOString()
        });
      } catch (syncError) {
        console.warn('Ошибка синхронизации после сохранения свечи:', syncError);
        // Fallback: обновляем сессию локально
        setCurrentSession({
          ...currentSession,
          current_candle_index: newCandleIndex,
          updated_at: new Date().toISOString()
        });
      }

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
      
      // ИСПРАВЛЕНИЕ: Обновляем локальное состояние и синхронизируем с БД
      updateCandles(prev => {
        const filtered = prev.filter(c => c.candle_index !== candleIndex);
        console.log(`🗑️ Удалена свеча ${candleIndex}, осталось: ${filtered.length}`);
        return filtered;
      });

      // Синхронизируем данные после удаления
      try {
        const syncResult = await sessionService.syncSessionData(currentSession.id);
        console.log(`📊 Синхронизация после удаления: индекс=${syncResult.session.current_candle_index}, свечей=${syncResult.actualCandleCount}`);
        
        setCurrentSession(syncResult.session);
      } catch (syncError) {
        console.warn('Ошибка синхронизации после удаления свечи:', syncError);
      }
      
      console.log('Candle deleted successfully:', candleIndex);
    } catch (error) {
      console.error('Error deleting candle:', error);
      addError('Ошибка удаления свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, updateCandles, setCurrentSession, addError]);

  const updateCandle = useCallback(async (candleIndex: number, updatedData: Partial<CandleData>) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
    }
    
    try {
      const updatedCandle = await candleService.updateCandle(currentSession.id, candleIndex, updatedData);

      if (updatedCandle) {
        updateCandles(prev => {
          const newCandles = prev.map(c => 
            c.candle_index === candleIndex ? updatedCandle : c
          );
          console.log(`✏️ Обновлена свеча ${candleIndex}`);
          return newCandles;
        });
        
        console.log('Candle updated successfully:', candleIndex);
        return updatedCandle;
      }
    } catch (error) {
      console.error('Error updating candle:', error);
      addError('Ошибка обновления свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, updateCandles, addError]);

  // НОВАЯ ФУНКЦИЯ: Принудительная синхронизация данных
  const syncCandleData = useCallback(async () => {
    if (!currentSession) {
      console.warn('Нет активной сессии для синхронизации');
      return;
    }

    try {
      console.log('🔄 Начинаем синхронизацию данных...');
      
      // Загружаем актуальные данные из БД
      const result = await sessionService.loadSessionWithCandles(currentSession.id);
      
      // Обновляем локальное состояние
      updateCandles(() => {
        console.log(`📊 Синхронизировано свечей: ${result.candles.length}`);
        return result.candles;
      });
      
      setCurrentSession(result.session);
      
      console.log('✅ Синхронизация завершена успешно');
    } catch (error) {
      console.error('Ошибка синхронизации данных:', error);
      addError('Ошибка синхронизации данных', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [currentSession, updateCandles, setCurrentSession, addError]);

  return {
    saveCandle,
    deleteCandle,
    updateCandle,
    syncCandleData // Экспортируем функцию синхронизации
  };
};

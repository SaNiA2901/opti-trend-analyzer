
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

      console.log('💾 Сохраняем свечу в БД:', fullCandleData);
      const savedCandle = await candleService.saveCandle(fullCandleData);

      if (!savedCandle) {
        throw new Error('Не удалось сохранить свечу');
      }

      // Сначала обновляем локальное состояние свечей
      updateCandles(prev => {
        const filtered = prev.filter(c => c.candle_index !== candleData.candle_index);
        const newCandles = [...filtered, savedCandle].sort((a, b) => a.candle_index - b.candle_index);
        
        console.log(`🕯️ Локальное обновление: ${prev.length} -> ${newCandles.length} свечей`);
        return newCandles;
      });

      // Вычисляем новый индекс
      const newCandleIndex = Math.max(
        currentSession.current_candle_index, 
        candleData.candle_index
      );
      
      console.log(`📈 Обновляем индекс сессии: ${currentSession.current_candle_index} -> ${newCandleIndex}`);
      
      // Обновляем индекс в БД
      await sessionService.updateSessionCandleIndex(currentSession.id, newCandleIndex);

      // Полная синхронизация данных после сохранения
      try {
        const syncResult = await sessionService.loadSessionWithCandles(currentSession.id);
        console.log(`📊 Полная синхронизация: сессия загружена с ${syncResult.candles.length} свечами`);
        
        // Обновляем и сессию, и свечи одновременно
        setCurrentSession(syncResult.session);
        updateCandles(() => syncResult.candles);
        
      } catch (syncError) {
        console.warn('⚠️ Ошибка полной синхронизации, используем fallback:', syncError);
        // Fallback: обновляем только сессию локально
        setCurrentSession({
          ...currentSession,
          current_candle_index: newCandleIndex,
          updated_at: new Date().toISOString()
        });
      }

      return savedCandle;
    } catch (error) {
      console.error('❌ Ошибка в saveCandle:', error);
      addError('Ошибка сохранения свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, updateCandles, setCurrentSession, addError]);

  const deleteCandle = useCallback(async (candleIndex: number) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
    }
    
    try {
      console.log(`🗑️ Удаляем свечу ${candleIndex} из БД...`);
      await candleService.deleteCandle(currentSession.id, candleIndex);
      
      // Обновляем локальное состояние
      updateCandles(prev => {
        const filtered = prev.filter(c => c.candle_index !== candleIndex);
        console.log(`🗑️ Локальное удаление: ${prev.length} -> ${filtered.length} свечей`);
        return filtered;
      });

      // Полная синхронизация после удаления
      try {
        const syncResult = await sessionService.loadSessionWithCandles(currentSession.id);
        console.log(`📊 Синхронизация после удаления: ${syncResult.candles.length} свечей`);
        
        setCurrentSession(syncResult.session);
        updateCandles(() => syncResult.candles);
        
      } catch (syncError) {
        console.warn('⚠️ Ошибка синхронизации после удаления:', syncError);
      }
      
      console.log('✅ Свеча удалена успешно:', candleIndex);
    } catch (error) {
      console.error('❌ Ошибка удаления свечи:', error);
      addError('Ошибка удаления свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, updateCandles, setCurrentSession, addError]);

  const updateCandle = useCallback(async (candleIndex: number, updatedData: Partial<CandleData>) => {
    if (!currentSession) {
      throw new Error('Нет активной сессии');
    }
    
    try {
      console.log(`✏️ Обновляем свечу ${candleIndex}:`, updatedData);
      const updatedCandle = await candleService.updateCandle(currentSession.id, candleIndex, updatedData);

      if (updatedCandle) {
        updateCandles(prev => {
          const newCandles = prev.map(c => 
            c.candle_index === candleIndex ? updatedCandle : c
          );
          console.log(`✏️ Локальное обновление свечи ${candleIndex}`);
          return newCandles;
        });
        
        console.log('✅ Свеча обновлена успешно:', candleIndex);
        return updatedCandle;
      }
    } catch (error) {
      console.error('❌ Ошибка обновления свечи:', error);
      addError('Ошибка обновления свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [currentSession, updateCandles, addError]);

  // УСОВЕРШЕНСТВОВАННАЯ функция принудительной синхронизации
  const syncCandleData = useCallback(async () => {
    if (!currentSession) {
      console.warn('⚠️ Нет активной сессии для синхронизации');
      return { success: false, reason: 'No active session' };
    }

    try {
      console.log('🔄 Начинаем полную синхронизацию данных...');
      
      // Загружаем актуальные данные из БД
      const result = await sessionService.loadSessionWithCandles(currentSession.id);
      
      console.log(`📊 Загружено из БД: сессия с индексом ${result.session.current_candle_index}, ${result.candles.length} свечей`);
      
      // Атомарно обновляем и сессию, и свечи
      setCurrentSession(result.session);
      updateCandles(() => {
        console.log(`📊 Синхронизировано свечей: ${result.candles.length}`);
        return result.candles;
      });
      
      console.log('✅ Полная синхронизация завершена успешно');
      return { success: true, candleCount: result.candles.length, sessionIndex: result.session.current_candle_index };
      
    } catch (error) {
      console.error('❌ Ошибка синхронизации данных:', error);
      addError('Ошибка синхронизации данных', error instanceof Error ? error.message : 'Unknown error');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [currentSession, updateCandles, setCurrentSession, addError]);

  // НОВАЯ функция: Проверка консистентности данных
  const validateDataConsistency = useCallback(async () => {
    if (!currentSession) return null;

    try {
      // Получаем актуальные данные из БД для сравнения
      const dbData = await sessionService.loadSessionWithCandles(currentSession.id);
      
      return {
        localCandleCount: 0, // Этот параметр должен приходить извне
        dbCandleCount: dbData.candles.length,
        localSessionIndex: currentSession.current_candle_index,
        dbSessionIndex: dbData.session.current_candle_index,
        isConsistent: dbData.candles.length === dbData.session.current_candle_index,
        needsSync: false // Будет определяться внешне
      };
    } catch (error) {
      console.error('❌ Ошибка проверки консистентности:', error);
      return null;
    }
  }, [currentSession]);

  return {
    saveCandle,
    deleteCandle,
    updateCandle,
    syncCandleData,
    validateDataConsistency
  };
};

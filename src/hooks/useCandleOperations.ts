
import { candleService } from '@/services/candleService';
import { sessionService } from '@/services/sessionService';
import { useCandleValidation } from './useCandleValidation';
import { useCandleTime } from './useCandleTime';
import { TradingSession, CandleData } from './useTradingSession';

export const useCandleOperations = (
  currentSession: TradingSession | null,
  setCandles: (updater: (prev: CandleData[]) => CandleData[]) => void,
  setCurrentSession: (updater: (prev: TradingSession | null) => TradingSession | null) => void
) => {
  const { validateCandleData } = useCandleValidation();
  const { calculateCandleTime } = useCandleTime();

  const saveCandle = async (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    const validation = validateCandleData(candleData);
    if (!validation.isValid) {
      throw new Error(`Validation errors: ${validation.errors.join(', ')}`);
    }

    try {
      console.log('Calculating candle time for index:', candleData.candle_index);
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

      console.log('Saving candle data to database:', fullCandleData);
      const savedCandle = await candleService.saveCandle(fullCandleData);

      const newCandleIndex = Math.max(currentSession.current_candle_index, candleData.candle_index);
      
      console.log('Updating session current_candle_index to:', newCandleIndex);
      await sessionService.updateSessionCandleIndex(currentSession.id, newCandleIndex);

      // Обновляем локальное состояние
      setCandles(prev => {
        const filtered = prev.filter(c => c.candle_index !== candleData.candle_index);
        return [...filtered, savedCandle].sort((a, b) => a.candle_index - b.candle_index);
      });

      setCurrentSession(prev => prev ? {
        ...prev,
        current_candle_index: newCandleIndex
      } : null);

      return savedCandle;
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

  return {
    saveCandle,
    getNextCandleTime
  };
};

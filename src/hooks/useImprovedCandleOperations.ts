
import { TradingSession, CandleData } from './useTradingSession';
import { useCandleSaving } from './candle/useCandleSaving';
import { useCandleOperations } from './candle/useCandleOperations';

export const useImprovedCandleOperations = (
  currentSession: TradingSession | null,
  setCandles: (updater: (prev: CandleData[]) => CandleData[]) => void,
  setCurrentSession: (updater: (prev: TradingSession | null) => TradingSession | null) => void
) => {
  const { saveCandle } = useCandleSaving(currentSession, setCandles, setCurrentSession);
  const { getNextCandleTime, deleteCandle, updateCandle } = useCandleOperations(currentSession, setCandles);

  return {
    saveCandle,
    getNextCandleTime,
    deleteCandle,
    updateCandle
  };
};

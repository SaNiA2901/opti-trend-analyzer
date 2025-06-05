
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TradingSession, CandleData } from '@/types/session';
import { calculateCandleDateTime } from '@/utils/dateTimeUtils';
import { useApplicationState } from '@/hooks/useApplicationState';
import CandleInputHeader from './candle-input/CandleInputHeader';
import CandleInputForm from './candle-input/CandleInputForm';
import CandleInputValidation from './candle-input/CandleInputValidation';
import CandleInputActions from './candle-input/CandleInputActions';
import CandleInputStats from './candle-input/CandleInputStats';
import { useCandleInputLogic } from './candle-input/useCandleInputLogic';

interface CandleInputProps {
  currentSession: TradingSession;
  candles: CandleData[];
  pair: string;
  onCandleSaved: (candleData: CandleData) => Promise<void>;
}

const CandleInput = ({ 
  currentSession,
  candles,
  pair,
  onCandleSaved
}: CandleInputProps) => {
  const { saveCandle, deleteLastCandle } = useApplicationState();
  
  const nextCandleIndex = useMemo(() => {
    return Math.max(currentSession.current_candle_index + 1, candles.length);
  }, [currentSession.current_candle_index, candles.length]);

  const nextCandleTime = useMemo(() => {
    try {
      return calculateCandleDateTime(
        currentSession.start_date,
        currentSession.start_time,
        currentSession.timeframe,
        nextCandleIndex
      );
    } catch (error) {
      console.error('Error calculating next candle time:', error);
      return '';
    }
  }, [currentSession, nextCandleIndex]);

  const {
    formData,
    errors,
    isSubmitting,
    isFormValid,
    lastCandle,
    updateField,
    handleSave,
    handleDeleteLast
  } = useCandleInputLogic({
    currentSession,
    candles,
    nextCandleIndex,
    onSave: async (candleData) => {
      const savedCandle = await saveCandle(candleData);
      if (savedCandle) {
        await onCandleSaved(savedCandle);
      }
      return savedCandle;
    },
    onDeleteLast: deleteLastCandle
  });

  return (
    <Card className="p-6 bg-slate-700/30 border-slate-600">
      <CandleInputHeader
        currentSession={currentSession}
        nextCandleIndex={nextCandleIndex}
        pair={pair}
        nextCandleTime={nextCandleTime}
      />

      <CandleInputForm
        formData={formData}
        onFieldChange={updateField}
        disabled={isSubmitting}
      />

      <CandleInputValidation
        errors={errors}
        isFormValid={isFormValid}
      />

      <CandleInputActions
        isFormValid={isFormValid}
        isSubmitting={isSubmitting}
        lastCandle={lastCandle}
        onSave={handleSave}
        onDeleteLast={handleDeleteLast}
      />

      <CandleInputStats candles={candles} />
    </Card>
  );
};

export default CandleInput;

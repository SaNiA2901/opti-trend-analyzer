
import { useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { TradingSession, CandleData } from '@/types/session';
import { calculateCandleDateTime } from '@/utils/dateTimeUtils';
import { useApplicationState } from '@/hooks/useApplicationState';
import { usePerformance } from '@/hooks/usePerformance';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import CandleInputHeader from './candle-input/CandleInputHeader';
import CandleInputForm from './candle-input/CandleInputForm';
import CandleInputValidation from './candle-input/CandleInputValidation';
import CandleInputActions from './candle-input/CandleInputActions';
import CandleInputStats from './candle-input/CandleInputStats';
import { useCandleInputLogic } from '@/hooks/candle/useCandleInputLogic';

interface CandleInputProps {
  currentSession: TradingSession;
  candles: CandleData[];
  pair: string;
  onCandleSaved: (candleData: CandleData) => Promise<void>;
}

const CandleInput = memo(({ 
  currentSession,
  candles,
  pair,
  onCandleSaved
}: CandleInputProps) => {
  const { saveCandle, deleteLastCandle } = useApplicationState();
  const { trackPerformance, memoizedValue } = usePerformance();
  const { safeExecute } = useErrorHandler();
  
  const nextCandleIndex = memoizedValue(
    () => Math.max(currentSession.current_candle_index + 1, candles.length),
    [currentSession.current_candle_index, candles.length],
    'nextCandleIndex'
  );

  const nextCandleTime = memoizedValue(() => {
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
  }, [currentSession, nextCandleIndex], 'nextCandleTime');

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
      return trackPerformance('saveCandleOperation', async () => {
        const savedCandle = await safeExecute(
          () => saveCandle(candleData),
          null,
          'Сохранение свечи'
        );
        
        if (savedCandle) {
          await safeExecute(
            () => onCandleSaved(savedCandle),
            undefined,
            'Обработка сохраненной свечи'
          );
        }
        return savedCandle;
      });
    },
    onDeleteLast: () => trackPerformance('deleteCandleOperation', () => 
      safeExecute(() => deleteLastCandle(), undefined, 'Удаление последней свечи')
    )
  });

  return (
    <Card className="p-6 bg-gradient-to-br from-card/80 to-card/50 border-border/50 backdrop-blur-sm animate-fade-in">
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
});

CandleInput.displayName = 'CandleInput';

export default CandleInput;

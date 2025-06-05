
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TradingSession, CandleData } from '@/types/session';
import { calculateCandleDateTime } from '@/utils/dateTimeUtils';
import CandleInputHeader from './CandleInputHeader';
import CandleInputForm from './CandleInputForm';
import CandleInputValidation from './CandleInputValidation';
import CandleInputActions from './CandleInputActions';
import CandleInputStats from './CandleInputStats';
import { useCandleInputLogic } from './useCandleInputLogic';

interface CandleInputContainerProps {
  currentSession: TradingSession;
  candles: CandleData[];
  nextCandleIndex: number;
  pair: string;
  onSave: (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => Promise<CandleData>;
  onDeleteLast: () => Promise<void>;
}

const CandleInputContainer = ({ 
  currentSession,
  candles,
  nextCandleIndex,
  pair,
  onSave,
  onDeleteLast
}: CandleInputContainerProps) => {
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
    onSave,
    onDeleteLast
  });

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

export default CandleInputContainer;

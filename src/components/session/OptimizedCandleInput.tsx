
import { Card } from '@/components/ui/card';
import { TradingSession, CandleData } from '@/types/session';
import CandleInputHeader from './candle-input/CandleInputHeader';
import CandleInputForm from './candle-input/CandleInputForm';
import CandleInputValidation from './candle-input/CandleInputValidation';
import CandleInputActions from './candle-input/CandleInputActions';
import CandleInputStats from './candle-input/CandleInputStats';
import { useCandleInputLogic } from './candle-input/useCandleInputLogic';

interface OptimizedCandleInputProps {
  currentSession: TradingSession;
  candles: CandleData[];
  nextCandleIndex: number;
  pair: string;
  nextCandleTime: string;
  onSave: (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => Promise<CandleData>;
  onDeleteLast: () => Promise<void>;
}

const OptimizedCandleInput = ({ 
  currentSession,
  candles,
  nextCandleIndex,
  pair,
  nextCandleTime,
  onSave,
  onDeleteLast
}: OptimizedCandleInputProps) => {
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

export default OptimizedCandleInput;


import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useTradingSession } from '@/hooks/useTradingSession';
import { useCandleInputLogic } from './hooks/useCandleInputLogic';
import CandleInputHeader from './CandleInputHeader';
import CandleInputForm from './CandleInputForm';
import CandleInputFooter from './CandleInputFooter';
import CandleInputErrors from './CandleInputErrors';

interface CandleInputProps {
  pair: string;
  onCandleSaved: (candleData: any) => void;
}

const CandleInput = ({ pair, onCandleSaved }: CandleInputProps) => {
  const { 
    currentSession, 
    candles, 
    nextCandleIndex,
    sessionStats
  } = useTradingSession();
  
  const {
    candleData,
    validationErrors,
    isSubmitting,
    isFormValid,
    nextCandleTime,
    lastCandle,
    updateField,
    handleSave,
    handleDeleteLastCandle
  } = useCandleInputLogic({
    currentSession,
    candles,
    nextCandleIndex,
    onCandleSaved
  });

  // Debug logging
  console.log('CandleInput: Rendering with session:', currentSession?.id || 'null');
  console.log('CandleInput: Candles count:', candles.length);

  const memoizedStats = useMemo(() => sessionStats, [sessionStats]);

  return (
    <Card className="p-6 bg-slate-700/30 border-slate-600">
      <CandleInputHeader
        nextCandleIndex={nextCandleIndex}
        currentSession={currentSession}
        nextCandleTime={nextCandleTime}
        pair={pair}
        sessionStats={memoizedStats}
      />

      <CandleInputForm
        candleData={candleData}
        onFieldChange={updateField}
        isDisabled={!currentSession}
        pair={pair}
      />

      <CandleInputErrors validationErrors={validationErrors} />

      <CandleInputFooter
        currentSession={currentSession}
        isValid={isFormValid}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        candles={candles}
        onDeleteLastCandle={handleDeleteLastCandle}
        lastCandle={lastCandle}
      />
    </Card>
  );
};

export default CandleInput;

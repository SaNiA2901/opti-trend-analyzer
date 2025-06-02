
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

  // Мемоизируем статистику для предотвращения ненужных ререндеров
  const memoizedStats = useMemo(() => sessionStats, [
    sessionStats.totalCandles,
    sessionStats.lastPrice,
    sessionStats.priceChange,
    sessionStats.highestPrice,
    sessionStats.lowestPrice,
    sessionStats.averageVolume
  ]);

  if (!currentSession) {
    return (
      <Card className="p-6 bg-slate-700/30 border-slate-600">
        <div className="text-center text-slate-400">
          <p>Выберите или создайте сессию для ввода данных свечей</p>
        </div>
      </Card>
    );
  }

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
        isDisabled={isSubmitting}
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

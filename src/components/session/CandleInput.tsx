
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useTradingSession } from '@/hooks/useTradingSession';
import { useFormValidation } from '@/hooks/useFormValidation';
import { validateCandleData } from '@/utils/candleValidation';
import CandleInputHeader from './CandleInputHeader';
import CandleInputForm from './CandleInputForm';
import CandleInputFooter from './CandleInputFooter';

interface CandleInputProps {
  pair: string;
  onCandleSaved: (candleData: any) => void;
}

interface CandleFormData {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

const CandleInput = ({ pair, onCandleSaved }: CandleInputProps) => {
  const { currentSession, candles, saveCandle, getNextCandleTime, nextCandleIndex } = useTradingSession();
  
  const [candleData, setCandleData] = useState<CandleFormData>({
    open: '',
    high: '',
    low: '',
    close: '',
    volume: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const nextCandleTime = currentSession ? getNextCandleTime(nextCandleIndex) : '';

  const parseNumber = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const updateField = (field: keyof CandleFormData, value: string) => {
    setCandleData(prev => ({
      ...prev,
      [field]: value
    }));
    setValidationErrors([]);
  };

  const handleSave = async () => {
    if (!currentSession) {
      setValidationErrors(['Нет активной сессии для сохранения данных']);
      return;
    }

    const numericData = {
      open: parseNumber(candleData.open),
      high: parseNumber(candleData.high),
      low: parseNumber(candleData.low),
      close: parseNumber(candleData.close),
      volume: parseNumber(candleData.volume)
    };

    const validation = validateCandleData(numericData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const savedCandle = await saveCandle({
        session_id: currentSession.id,
        candle_index: nextCandleIndex,
        ...numericData
      });

      console.log('Candle saved successfully:', savedCandle);
      onCandleSaved(savedCandle);
      
      setCandleData({
        open: candleData.close,
        high: '',
        low: '',
        close: '',
        volume: ''
      });
      setValidationErrors([]);
    } catch (error) {
      console.error('Error saving candle:', error);
      setValidationErrors([error instanceof Error ? error.message : 'Ошибка сохранения']);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (candles.length > 0 && !candleData.open) {
      const lastCandle = candles[candles.length - 1];
      setCandleData(prev => ({
        ...prev,
        open: lastCandle.close.toString()
      }));
    }
  }, [candles, candleData.open]);

  const isFormValid = Object.values(candleData).every(value => value.trim() !== '');

  return (
    <Card className="p-6 bg-slate-700/30 border-slate-600">
      <CandleInputHeader
        nextCandleIndex={nextCandleIndex}
        currentSession={currentSession}
        nextCandleTime={nextCandleTime}
        pair={pair}
      />

      <CandleInputForm
        candleData={candleData}
        onFieldChange={updateField}
        isDisabled={!currentSession}
        pair={pair}
      />

      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg">
          <ul className="text-red-200 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <CandleInputFooter
        currentSession={currentSession}
        isValid={isFormValid}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        candles={candles}
      />
    </Card>
  );
};

export default CandleInput;


import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CandleInputFormProps {
  candleData: {
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  };
  onFieldChange: (field: string, value: string) => void;
  isDisabled: boolean;
  pair: string;
}

const CandleInputForm = ({ candleData, onFieldChange, isDisabled, pair }: CandleInputFormProps) => {
  const getPlaceholder = (type: string): string => {
    if (pair === "BTC/USD") {
      const placeholders = { open: "67500", high: "68000", low: "67000", close: "67800" };
      return placeholders[type as keyof typeof placeholders] || "";
    }
    if (pair.includes("JPY")) {
      const placeholders = { open: "149.50", high: "149.85", low: "149.20", close: "149.70" };
      return placeholders[type as keyof typeof placeholders] || "";
    }
    const placeholders = { open: "1.0850", high: "1.0875", low: "1.0830", close: "1.0860" };
    return placeholders[type as keyof typeof placeholders] || "";
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <Label htmlFor="open" className="text-slate-300">Open (Открытие)</Label>
          <Input
            id="open"
            type="number"
            step="any"
            placeholder={getPlaceholder("open")}
            value={candleData.open}
            onChange={(e) => onFieldChange('open', e.target.value)}
            disabled={isDisabled}
            className={`bg-slate-800 border-slate-600 text-white ${isDisabled ? 'opacity-50' : ''}`}
          />
        </div>
        
        <div>
          <Label htmlFor="high" className="text-slate-300">High (Максимум)</Label>
          <Input
            id="high"
            type="number"
            step="any"
            placeholder={getPlaceholder("high")}
            value={candleData.high}
            onChange={(e) => onFieldChange('high', e.target.value)}
            disabled={isDisabled}
            className={`bg-slate-800 border-slate-600 text-white ${isDisabled ? 'opacity-50' : ''}`}
          />
        </div>
        
        <div>
          <Label htmlFor="low" className="text-slate-300">Low (Минимум)</Label>
          <Input
            id="low"
            type="number"
            step="any"
            placeholder={getPlaceholder("low")}
            value={candleData.low}
            onChange={(e) => onFieldChange('low', e.target.value)}
            disabled={isDisabled}
            className={`bg-slate-800 border-slate-600 text-white ${isDisabled ? 'opacity-50' : ''}`}
          />
        </div>
        
        <div>
          <Label htmlFor="close" className="text-slate-300">Close (Закрытие)</Label>
          <Input
            id="close"
            type="number"
            step="any"
            placeholder={getPlaceholder("close")}
            value={candleData.close}
            onChange={(e) => onFieldChange('close', e.target.value)}
            disabled={isDisabled}
            className={`bg-slate-800 border-slate-600 text-white ${isDisabled ? 'opacity-50' : ''}`}
          />
        </div>
      </div>

      <div className="mb-4">
        <Label htmlFor="volume" className="text-slate-300">Volume (Объем)</Label>
        <Input
          id="volume"
          type="number"
          min="0"
          step="any"
          placeholder={pair === "BTC/USD" ? "5000" : "1500"}
          value={candleData.volume}
          onChange={(e) => onFieldChange('volume', e.target.value)}
          disabled={isDisabled}
          className={`bg-slate-800 border-slate-600 text-white ${isDisabled ? 'opacity-50' : ''}`}
        />
      </div>
    </>
  );
};

export default CandleInputForm;

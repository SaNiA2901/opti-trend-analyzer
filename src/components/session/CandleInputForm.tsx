
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sanitizeNumericInput } from '@/utils/candleValidation';

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
  const handleInputChange = (field: string, value: string) => {
    const sanitizedValue = sanitizeNumericInput(value);
    onFieldChange(field, sanitizedValue);
  };

  const inputFields = [
    { key: 'open', label: 'Открытие (Open)', placeholder: '1.23456' },
    { key: 'high', label: 'Максимум (High)', placeholder: '1.23500' },
    { key: 'low', label: 'Минимум (Low)', placeholder: '1.23400' },
    { key: 'close', label: 'Закрытие (Close)', placeholder: '1.23450' },
    { key: 'volume', label: 'Объем (Volume)', placeholder: '1000000' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
      {inputFields.map(({ key, label, placeholder }) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium text-slate-300">
            {label}
          </Label>
          <Input
            id={key}
            type="text"
            value={candleData[key as keyof typeof candleData]}
            onChange={(e) => handleInputChange(key, e.target.value)}
            placeholder={placeholder}
            disabled={isDisabled}
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      ))}
    </div>
  );
};

export default CandleInputForm;

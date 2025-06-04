
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CandleInputFormProps {
  formData: {
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  };
  onFieldChange: (field: string, value: string) => void;
  disabled?: boolean;
}

const CandleInputForm = ({ formData, onFieldChange, disabled = false }: CandleInputFormProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="open" className="text-slate-300">Открытие (Open)</Label>
        <Input
          id="open"
          type="number"
          step="any"
          value={formData.open}
          onChange={(e) => onFieldChange('open', e.target.value)}
          placeholder="1.23456"
          className="bg-slate-700 border-slate-600 text-white"
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor="high" className="text-slate-300">Максимум (High)</Label>
        <Input
          id="high"
          type="number"
          step="any"
          value={formData.high}
          onChange={(e) => onFieldChange('high', e.target.value)}
          placeholder="1.23500"
          className="bg-slate-700 border-slate-600 text-white"
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor="low" className="text-slate-300">Минимум (Low)</Label>
        <Input
          id="low"
          type="number"
          step="any"
          value={formData.low}
          onChange={(e) => onFieldChange('low', e.target.value)}
          placeholder="1.23400"
          className="bg-slate-700 border-slate-600 text-white"
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor="close" className="text-slate-300">Закрытие (Close)</Label>
        <Input
          id="close"
          type="number"
          step="any"
          value={formData.close}
          onChange={(e) => onFieldChange('close', e.target.value)}
          placeholder="1.23450"
          className="bg-slate-700 border-slate-600 text-white"
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor="volume" className="text-slate-300">Объем (Volume)</Label>
        <Input
          id="volume"
          type="number"
          value={formData.volume}
          onChange={(e) => onFieldChange('volume', e.target.value)}
          placeholder="1000000"
          className="bg-slate-700 border-slate-600 text-white"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default CandleInputForm;

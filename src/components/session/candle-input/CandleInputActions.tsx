
import { Button } from '@/components/ui/button';
import { Save, Trash2 } from 'lucide-react';
import { CandleData } from '@/types/session';

interface CandleInputActionsProps {
  isFormValid: boolean;
  isSubmitting: boolean;
  lastCandle: CandleData | null;
  onSave: () => void;
  onDeleteLast: () => void;
}

const CandleInputActions = ({ 
  isFormValid, 
  isSubmitting, 
  lastCandle, 
  onSave, 
  onDeleteLast 
}: CandleInputActionsProps) => {
  return (
    <div className="flex space-x-2">
      {lastCandle && (
        <Button 
          onClick={onDeleteLast}
          variant="destructive"
          size="sm"
          className="bg-red-600 hover:bg-red-700"
          disabled={isSubmitting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Удалить последнюю
        </Button>
      )}
      
      <Button 
        onClick={onSave}
        disabled={!isFormValid || isSubmitting}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSubmitting ? 'Сохранение...' : 'Сохранить свечу'}
      </Button>
    </div>
  );
};

export default CandleInputActions;

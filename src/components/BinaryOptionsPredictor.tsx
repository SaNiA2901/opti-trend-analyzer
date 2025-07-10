
import { memo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import PredictionHeader from './predictor/PredictionHeader';
import PredictionTabs from './predictor/PredictionTabs';
import PerformanceMonitor from './common/PerformanceMonitor';
import { useApplicationState } from '@/hooks/useApplicationState';
import { usePredictionLogic } from '@/hooks/usePredictionLogic';
import { usePredictionGeneration } from '@/hooks/usePredictionGeneration';

interface BinaryOptionsPredictorProps {
  pair: string;
  timeframe: string;
}

const BinaryOptionsPredictor = memo(({ pair, timeframe }: BinaryOptionsPredictorProps) => {
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  
  const {
    currentSession,
    candles,
    isLoading
  } = useApplicationState();

  const { handleCandleSaved } = usePredictionLogic({
    currentSession,
    pair,
    timeframe
  });

  const { predictionResult, isGenerating } = usePredictionGeneration();

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 bg-gradient-to-br from-card/80 to-card/50 border-border/50 backdrop-blur-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <PredictionHeader 
            pair={pair} 
            timeframe={timeframe} 
            isActive={!!currentSession && !isGenerating}
          />
          
          {/* Debug controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
            className="bg-background/50"
          >
            <Settings className="h-4 w-4 mr-2" />
            {showPerformanceMonitor ? 'Скрыть отладку' : 'Показать отладку'}
          </Button>
        </div>
        
        <div className="mt-6">
          <PredictionTabs
            currentSession={currentSession}
            candles={candles}
            pair={pair}
            timeframe={timeframe}
            predictionResult={predictionResult}
            onCandleSaved={handleCandleSaved}
          />
        </div>
      </Card>

      {/* Performance Monitor - опциональный для отладки */}
      <PerformanceMonitor isVisible={showPerformanceMonitor} />
    </div>
  );
});

BinaryOptionsPredictor.displayName = 'BinaryOptionsPredictor';

export default BinaryOptionsPredictor;

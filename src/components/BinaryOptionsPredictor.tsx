
import { memo } from 'react';
import { Card } from '@/components/ui/card';
import PredictionHeader from './predictor/PredictionHeader';
import PredictionTabs from './predictor/PredictionTabs';
import { useApplicationState } from '@/hooks/useApplicationState';
import { usePredictionLogic } from '@/hooks/usePredictionLogic';
import { usePredictionGeneration } from '@/hooks/usePredictionGeneration';

interface BinaryOptionsPredictorProps {
  pair: string;
  timeframe: string;
}

const BinaryOptionsPredictor = memo(({ pair, timeframe }: BinaryOptionsPredictorProps) => {
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
        <PredictionHeader 
          pair={pair} 
          timeframe={timeframe} 
          isActive={!!currentSession && !isGenerating}
        />
        
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
    </div>
  );
});

BinaryOptionsPredictor.displayName = 'BinaryOptionsPredictor';

export default BinaryOptionsPredictor;

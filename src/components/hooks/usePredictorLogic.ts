
import { useCallback } from 'react';
import { useTradingSession, TradingSession } from '@/hooks/useTradingSession';
import { PredictionConfig } from '@/types/trading';

interface UsePredictorLogicProps {
  currentSession: TradingSession | null;
  generatePrediction: (candleData: any, config: PredictionConfig) => Promise<any>;
  predictionConfig: PredictionConfig;
}

export const usePredictorLogic = ({
  currentSession,
  generatePrediction,
  predictionConfig
}: UsePredictorLogicProps) => {
  const { updateCandle } = useTradingSession();

  const handleCandleSaved = useCallback(async (candleData: any) => {
    console.log('usePredictorLogic: Candle saved, generating prediction...', candleData);
    
    if (!candleData || !currentSession) {
      console.warn('usePredictorLogic: Missing candleData or currentSession');
      return;
    }

    try {
      const prediction = await generatePrediction(candleData, predictionConfig);
      
      if (prediction && typeof candleData.candle_index === 'number') {
        console.log('usePredictorLogic: Updating candle with prediction:', prediction);
        
        await updateCandle(candleData.candle_index, {
          prediction_direction: prediction.direction,
          prediction_probability: prediction.probability,
          prediction_confidence: prediction.confidence
        });
      }
    } catch (error) {
      console.error('usePredictorLogic: Error saving prediction:', error);
    }
  }, [currentSession, generatePrediction, predictionConfig, updateCandle]);

  return {
    handleCandleSaved
  };
};

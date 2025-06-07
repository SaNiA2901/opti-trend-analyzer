
import { useCallback } from 'react';
import { TradingSession, CandleData } from '@/types/session';
import { usePredictionGeneration } from './usePredictionGeneration';
import { useApplicationState } from './useApplicationState';

interface UsePredictionLogicProps {
  currentSession: TradingSession | null;
  pair: string;
  timeframe: string;
}

export const usePredictionLogic = ({ 
  currentSession, 
  pair, 
  timeframe 
}: UsePredictionLogicProps) => {
  const { updateCandle } = useApplicationState();
  const { generatePrediction } = usePredictionGeneration();

  const handleCandleSaved = useCallback(async (candleData: CandleData) => {
    if (!currentSession) return;

    try {
      console.log('PredictionLogic: Generating prediction for candle:', candleData.candle_index);
      
      const predictionConfig = {
        predictionInterval: 5,
        analysisMode: 'session' as const
      };

      const prediction = await generatePrediction(candleData, predictionConfig);
      
      if (prediction && typeof candleData.candle_index === 'number') {
        const updatedCandle: CandleData = {
          ...candleData,
          prediction_direction: prediction.direction,
          prediction_probability: prediction.probability,
          prediction_confidence: prediction.confidence
        };

        await updateCandle(candleData.candle_index, updatedCandle);
        console.log('PredictionLogic: Prediction saved to candle');
      }
    } catch (error) {
      console.error('PredictionLogic: Error generating prediction:', error);
    }
  }, [currentSession, generatePrediction, updateCandle]);

  return {
    handleCandleSaved
  };
};

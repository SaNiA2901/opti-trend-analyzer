
import { useState } from 'react';
import { PredictionResult, PredictionConfig } from '@/types/trading';

export const usePredictionGeneration = () => {
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePrediction = async (candleData: any, predictionConfig: PredictionConfig) => {
    if (!candleData?.open || !candleData?.high || !candleData?.low || !candleData?.close) {
      console.error('Invalid candle data for prediction:', candleData);
      return null;
    }

    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { open, high, low, close, volume } = candleData;
      
      const priceRange = high - low;
      const bodySize = Math.abs(close - open);
      const upperShadow = high - Math.max(open, close);
      const lowerShadow = Math.min(open, close) - low;
      
      const isBullish = close > open;
      const isHammer = bodySize < priceRange * 0.3 && lowerShadow > bodySize * 2;
      const isDoji = bodySize < priceRange * 0.1;
      
      const volumeFactor = Math.min(100, Math.max(10, (volume / 1000) * 20));
      
      const technicalFactor = isBullish ? 
        (isHammer ? 85 : (isDoji ? 50 : 65)) : 
        (isHammer ? 15 : (isDoji ? 50 : 35));
      
      const momentumFactor = isBullish ? 
        Math.min(90, 50 + (bodySize / priceRange) * 40) :
        Math.max(10, 50 - (bodySize / priceRange) * 40);
      
      const volatilityFactor = Math.min(90, Math.max(10, (priceRange / open) * 1000));
      
      const weightedScore = (
        technicalFactor * 0.4 +
        volumeFactor * 0.2 +
        momentumFactor * 0.25 +
        volatilityFactor * 0.15
      );

      const direction = weightedScore > 50 ? 'UP' : 'DOWN';
      const probability = Math.min(95, Math.max(55, weightedScore));
      const confidence = Math.min(90, Math.max(60, probability - 5));

      const result: PredictionResult = {
        direction,
        probability,
        confidence,
        interval: predictionConfig.predictionInterval,
        factors: {
          technical: technicalFactor,
          volume: volumeFactor,
          momentum: momentumFactor,
          volatility: volatilityFactor
        },
        recommendation: direction === 'UP' ? 
          `Рекомендуем CALL опцион на ${predictionConfig.predictionInterval} мин. ${isHammer ? 'Обнаружен паттерн "Молот"' : ''}` :
          `Рекомендуем PUT опцион на ${predictionConfig.predictionInterval} мин. ${isHammer ? 'Обнаружен медвежий паттерн' : ''}`
      };

      setPredictionResult(result);
      return result;
    } catch (error) {
      console.error('Error generating prediction:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    predictionResult,
    setPredictionResult,
    isGenerating,
    generatePrediction
  };
};

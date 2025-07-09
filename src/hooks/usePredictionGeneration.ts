
import { useState, useCallback } from 'react';
import { PredictionResult, PredictionConfig } from '@/types/trading';
import { CandleData } from '@/types/session';
import { predictionService } from '@/services/predictionService';

// Хранилище результатов для обучения модели
const predictionHistory: Array<{ 
  factors: any; 
  result: boolean; 
  timestamp: number;
  prediction: PredictionResult;
  actualOutcome?: 'UP' | 'DOWN';
}> = [];

export const usePredictionGeneration = () => {
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelAccuracy, setModelAccuracy] = useState<number>(0);

  // Основная функция генерации прогноза
  const generatePrediction = useCallback(async (
    candleData: CandleData, 
    predictionConfig: PredictionConfig,
    historicalCandles?: CandleData[]
  ): Promise<PredictionResult | null> => {
    if (!candleData?.open || !candleData?.high || !candleData?.low || !candleData?.close) {
      console.error('Invalid candle data for prediction:', candleData);
      return null;
    }

    setIsGenerating(true);
    
    try {
      // Если есть исторические данные, используем продвинутую модель
      if (historicalCandles && historicalCandles.length > 0) {
        const currentIndex = historicalCandles.findIndex(c => c.candle_index === candleData.candle_index);
        
        if (currentIndex >= 0 && currentIndex < historicalCandles.length - 1) {
          const prediction = await predictionService.generateAdvancedPrediction(
            historicalCandles,
            currentIndex,
            predictionConfig
          );
          
          if (prediction) {
            setPredictionResult(prediction);
            
            // Сохраняем для обучения модели
            predictionHistory.push({
              factors: prediction.factors,
              result: false, // Будет обновлено позже
              timestamp: Date.now(),
              prediction
            });
            
            return prediction;
          }
        }
      }
      
      // Fallback на простую модель
      const simplePrediction = await generateSimplePrediction(candleData, predictionConfig);
      setPredictionResult(simplePrediction);
      return simplePrediction;
      
    } catch (error) {
      console.error('Error generating prediction:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Простая модель (fallback)
  const generateSimplePrediction = async (
    candleData: CandleData, 
    predictionConfig: PredictionConfig
  ): Promise<PredictionResult> => {
    // Имитация времени обработки
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const { open, high, low, close, volume } = candleData;
    
    // Базовые расчеты
    const priceRange = high - low;
    const bodySize = Math.abs(close - open);
    const upperShadow = high - Math.max(open, close);
    const lowerShadow = Math.min(open, close) - low;
    
    const isBullish = close > open;
    const isHammer = bodySize < priceRange * 0.3 && lowerShadow > bodySize * 2;
    const isDoji = bodySize < priceRange * 0.1;
    
    // Базовые факторы
    const volumeFactor = Math.min(95, Math.max(30, (volume / 1000) * 25));
    const technicalFactor = isBullish ? 
      (isHammer ? 85 : (isDoji ? 50 : 70)) : 
      (isHammer ? 15 : (isDoji ? 50 : 30));
    const momentumFactor = isBullish ? 
      Math.min(90, 50 + (bodySize / priceRange) * 40) :
      Math.max(10, 50 - (bodySize / priceRange) * 40);
    const volatilityFactor = Math.min(90, Math.max(20, (priceRange / open) * 1500));

    const weightedScore = (
      technicalFactor * 0.4 +
      volumeFactor * 0.2 +
      momentumFactor * 0.25 +
      volatilityFactor * 0.15
    );

    const direction = weightedScore > 50 ? 'UP' : 'DOWN';
    const probability = Math.min(95, Math.max(60, weightedScore));
    const confidence = Math.min(90, Math.max(65, probability - 3));

    return {
      direction,
      probability: Number(probability.toFixed(1)),
      confidence: Number(confidence.toFixed(1)),
      interval: predictionConfig.predictionInterval,
      factors: {
        technical: technicalFactor,
        volume: volumeFactor,
        momentum: momentumFactor,
        volatility: volatilityFactor,
        pattern: isHammer ? 75 : (isDoji ? 60 : 50),
        trend: isBullish ? 65 : 35
      },
      recommendation: direction === 'UP' ? 
        `Рекомендуем CALL опцион на ${predictionConfig.predictionInterval} мин${isHammer ? '. Обнаружен паттерн "Молот"' : ''}` :
        `Рекомендуем PUT опцион на ${predictionConfig.predictionInterval} мин${isHammer ? '. Обнаружен медвежий паттерн' : ''}`
    };
  };

  // Обновление результата прогноза (для обучения модели)
  const updatePredictionResult = useCallback((
    predictionId: number, 
    actualOutcome: 'UP' | 'DOWN'
  ) => {
    if (predictionHistory[predictionId]) {
      const prediction = predictionHistory[predictionId];
      prediction.actualOutcome = actualOutcome;
      prediction.result = prediction.prediction.direction === actualOutcome;
      
      // Обновляем модель
      const recentPredictions = predictionHistory.slice(-50); // Последние 50 прогнозов
      predictionService.updateModelWeights(recentPredictions);
      
      // Обновляем точность модели
      const accuratePredictions = recentPredictions.filter(p => p.result && p.actualOutcome).length;
      const totalPredictions = recentPredictions.filter(p => p.actualOutcome).length;
      setModelAccuracy(totalPredictions > 0 ? (accuratePredictions / totalPredictions) * 100 : 0);
    }
  }, []);

  // Получение статистики модели
  const getModelStats = useCallback(() => {
    const completedPredictions = predictionHistory.filter(p => p.actualOutcome);
    const accurateCount = completedPredictions.filter(p => p.result).length;
    
    const callPredictions = completedPredictions.filter(p => p.prediction.direction === 'UP');
    const putPredictions = completedPredictions.filter(p => p.prediction.direction === 'DOWN');
    
    const callAccuracy = callPredictions.length > 0 ? 
      (callPredictions.filter(p => p.result).length / callPredictions.length) * 100 : 0;
    const putAccuracy = putPredictions.length > 0 ? 
      (putPredictions.filter(p => p.result).length / putPredictions.length) * 100 : 0;
    
    return {
      totalPredictions: completedPredictions.length,
      accurateCount,
      overallAccuracy: completedPredictions.length > 0 ? (accurateCount / completedPredictions.length) * 100 : 0,
      callAccuracy,
      putAccuracy,
      currentWeights: predictionService.getModelWeights()
    };
  }, []);

  // Batch генерация прогнозов
  const generateBatchPredictions = useCallback(async (
    candles: CandleData[],
    config: PredictionConfig
  ): Promise<PredictionResult[]> => {
    const results: PredictionResult[] = [];
    
    for (let i = 5; i < candles.length; i++) { // Начинаем с 5-й свечи для истории
      const prediction = await predictionService.generateAdvancedPrediction(
        candles,
        i,
        config
      );
      if (prediction) {
        results.push(prediction);
      }
    }
    
    return results;
  }, []);

  return {
    predictionResult,
    setPredictionResult,
    isGenerating,
    modelAccuracy,
    generatePrediction,
    updatePredictionResult,
    getModelStats,
    generateBatchPredictions
  };
};

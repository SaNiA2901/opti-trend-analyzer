
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, Database } from "lucide-react";
import PredictionSettings from "./predictor/PredictionSettings";
import PredictionResults from "./predictor/PredictionResults";
import SessionManager from "./session/SessionManager";
import CandleInput from "./session/CandleInput";
import { useTradingSession } from "@/hooks/useTradingSession";

interface BinaryOptionsPredictorProps {
  pair: string;
  timeframe: string;
}

export interface PredictionConfig {
  predictionInterval: number;
  analysisMode: 'session';
}

export interface PredictionResult {
  direction: 'UP' | 'DOWN';
  probability: number;
  confidence: number;
  interval: number;
  factors: {
    technical: number;
    volume: number;
    momentum: number;
    volatility: number;
  };
  recommendation: string;
}

const BinaryOptionsPredictor = ({ pair, timeframe }: BinaryOptionsPredictorProps) => {
  const { currentSession, candles, saveCandle } = useTradingSession();
  const [predictionConfig, setPredictionConfig] = useState<PredictionConfig>({
    predictionInterval: 5,
    analysisMode: 'session'
  });
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const generatePrediction = async (candleData: any) => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const { open, high, low, close, volume } = candleData;
      
      // Технический анализ на основе данных свечи
      const priceRange = high - low;
      const bodySize = Math.abs(close - open);
      const upperShadow = high - Math.max(open, close);
      const lowerShadow = Math.min(open, close) - low;
      
      // Анализ паттернов
      const isBullish = close > open;
      const isHammer = bodySize < priceRange * 0.3 && lowerShadow > bodySize * 2;
      const isDoji = bodySize < priceRange * 0.1;
      
      // Анализ объема
      const volumeFactor = Math.min(100, (volume / 1000) * 20);
      
      // Технические факторы
      const technicalFactor = isBullish ? 
        (isHammer ? 85 : (isDoji ? 50 : 65)) : 
        (isHammer ? 15 : (isDoji ? 50 : 35));
      
      // Анализ моментума
      const momentumFactor = isBullish ? 
        Math.min(90, 50 + (bodySize / priceRange) * 40) :
        Math.max(10, 50 - (bodySize / priceRange) * 40);
      
      // Анализ волатильности
      const volatilityFactor = Math.min(90, Math.max(10, (priceRange / open) * 1000));
      
      // Взвешенная оценка
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
      setIsGenerating(false);

      // Сохраняем прогноз в базу данных
      if (currentSession && candleData.candle_index !== undefined) {
        saveCandle({
          session_id: currentSession.id,
          candle_index: candleData.candle_index,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: candleData.volume,
          prediction_direction: direction,
          prediction_probability: probability,
          prediction_confidence: confidence
        });
      }
    }, 1500);
  };

  const handleCandleSaved = (candleData: any) => {
    generatePrediction(candleData);
  };

  return (
    <div className="space-y-6">
      {/* Информация о режиме */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Система торговых сессий</h3>
          <Badge className="bg-green-600 text-white">Реальное время</Badge>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-4">
          <ul className="text-slate-300 text-sm space-y-2">
            <li>• Создавайте сессии с автоматическим расчетом времени свечей</li>
            <li>• Каждая свеча сохраняется в базе данных в реальном времени</li>
            <li>• Возможность продолжить работу с любого места после сбоя</li>
            <li>• Автоматические прогнозы для каждой введенной свечи</li>
          </ul>
        </div>
      </Card>

      {/* Управление сессиями */}
      <SessionManager 
        pair={pair} 
        onSessionSelected={setSelectedSessionId}
      />

      {/* Ввод данных свечи */}
      {currentSession && (
        <CandleInput 
          pair={pair}
          onCandleSaved={handleCandleSaved}
        />
      )}

      {/* Настройки прогноза */}
      <PredictionSettings 
        config={predictionConfig}
        onChange={setPredictionConfig}
      />

      {/* Индикатор обработки */}
      {isGenerating && (
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-blue-400 animate-spin" />
              <span className="text-white">Генерация прогноза...</span>
            </div>
            <Progress value={75} className="mb-2" />
            <p className="text-slate-400 text-sm">Анализ данных свечи и создание рекомендации</p>
          </div>
        </Card>
      )}

      {/* Результаты прогноза */}
      {predictionResult && !isGenerating && (
        <PredictionResults 
          result={predictionResult}
          pair={pair}
        />
      )}

      {/* История свечей */}
      {candles.length > 0 && (
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <h4 className="text-lg font-medium text-white mb-4">История свечей текущей сессии</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {candles.slice(-6).map((candle, index) => (
              <div key={candle.id || index} className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Свеча #{candle.candle_index + 1}</span>
                  {candle.prediction_direction && (
                    <Badge className={candle.prediction_direction === 'UP' ? 'bg-green-600' : 'bg-red-600'}>
                      {candle.prediction_direction}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>O: {candle.open} | H: {candle.high}</div>
                  <div>L: {candle.low} | C: {candle.close}</div>
                  <div>V: {candle.volume}</div>
                  {candle.prediction_probability && (
                    <div className="text-blue-300">
                      Вероятность: {candle.prediction_probability.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BinaryOptionsPredictor;

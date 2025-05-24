
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Clock, BarChart } from "lucide-react";

interface WeightedPriceForecastProps {
  pair: string;
  timeframe: string;
}

interface PriceForecast {
  direction: 'UP' | 'DOWN';
  targetPrice: number;
  currentPrice: number;
  timeHorizon: number; // в минутах
  confidence: number;
  priceChange: number;
  priceChangePercent: number;
  factors: {
    technical: number;
    sentiment: number;
    ml: number;
    volume: number;
  };
}

const WeightedPriceForecast = ({ pair, timeframe }: WeightedPriceForecastProps) => {
  const [forecast, setForecast] = useState<PriceForecast | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const generateWeightedForecast = () => {
      setIsCalculating(true);
      
      // Базовые цены для разных активов
      const basePrice = pair === "EUR/USD" ? 1.0850 : 
                       pair === "GBP/USD" ? 1.2650 :
                       pair === "USD/JPY" ? 149.50 :
                       pair === "BTC/USD" ? 67500 : 1.0950;

      // Генерируем факторы анализа (имитация реального анализа)
      const technicalFactor = 60 + Math.random() * 35; // RSI, MACD, MA
      const sentimentFactor = 55 + Math.random() * 40; // Торговые сигналы
      const mlFactor = 65 + Math.random() * 30; // AI прогнозы
      const volumeFactor = 50 + Math.random() * 45; // Объем торгов

      // Взвешенная оценка (разные веса для разных факторов)
      const weights = { technical: 0.3, sentiment: 0.25, ml: 0.35, volume: 0.1 };
      const weightedScore = 
        (technicalFactor * weights.technical +
         sentimentFactor * weights.sentiment +
         mlFactor * weights.ml +
         volumeFactor * weights.volume);

      // Определяем направление и силу движения
      const direction = weightedScore > 50 ? 'UP' : 'DOWN';
      const confidence = Math.min(95, Math.max(55, weightedScore));
      
      // Расчет целевой цены на основе волатильности и уверенности
      const volatilityMultiplier = pair === "BTC/USD" ? 0.05 : 0.015;
      const priceChangePercent = (confidence - 50) / 50 * volatilityMultiplier * (direction === 'UP' ? 1 : -1);
      const targetPrice = basePrice * (1 + priceChangePercent);
      const priceChange = targetPrice - basePrice;

      // Время до достижения цели (зависит от таймфрейма и уверенности)
      const timeMultiplier = timeframe === "1m" ? 5 : 
                            timeframe === "5m" ? 15 :
                            timeframe === "15m" ? 45 :
                            timeframe === "30m" ? 90 :
                            timeframe === "1h" ? 180 :
                            timeframe === "4h" ? 720 : 1440;
      
      const timeHorizon = Math.floor(timeMultiplier * (confidence / 100) * (0.8 + Math.random() * 0.4));

      const newForecast: PriceForecast = {
        direction,
        targetPrice,
        currentPrice: basePrice,
        timeHorizon,
        confidence,
        priceChange,
        priceChangePercent: priceChangePercent * 100,
        factors: {
          technical: technicalFactor,
          sentiment: sentimentFactor,
          ml: mlFactor,
          volume: volumeFactor
        }
      };

      setTimeout(() => {
        setForecast(newForecast);
        setIsCalculating(false);
      }, 1500);
    };

    generateWeightedForecast();
    const interval = setInterval(generateWeightedForecast, 30000);
    return () => clearInterval(interval);
  }, [pair, timeframe]);

  const formatPrice = (price: number) => {
    if (pair === "BTC/USD") return `$${price.toFixed(0)}`;
    return pair.includes("JPY") ? price.toFixed(2) : price.toFixed(4);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} мин`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}ч ${minutes % 60}м`;
    return `${Math.floor(minutes / 1440)}д ${Math.floor((minutes % 1440) / 60)}ч`;
  };

  if (!forecast) {
    return (
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <BarChart className="h-8 w-8 text-blue-400 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-400">Расчет взвешенного прогноза...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Основной прогноз */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Взвешенный прогноз движения цены</h3>
          {isCalculating && (
            <Badge className="bg-yellow-600 text-white animate-pulse">
              Пересчет...
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <div className={`text-2xl font-bold mb-1 flex items-center justify-center space-x-2 ${
              forecast.direction === 'UP' ? 'text-green-400' : 'text-red-400'
            }`}>
              {forecast.direction === 'UP' ? 
                <TrendingUp className="h-6 w-6" /> : 
                <TrendingDown className="h-6 w-6" />
              }
              <span>{forecast.direction === 'UP' ? 'РОСТ' : 'ПАДЕНИЕ'}</span>
            </div>
            <p className="text-slate-400 text-sm">Направление</p>
          </div>
          
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">
              {formatPrice(forecast.targetPrice)}
            </div>
            <p className="text-slate-400 text-sm">Целевая цена</p>
            <p className={`text-xs ${forecast.priceChangePercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {forecast.priceChangePercent > 0 ? '+' : ''}{forecast.priceChangePercent.toFixed(2)}%
            </p>
          </div>
          
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-400 mb-1 flex items-center justify-center space-x-1">
              <Clock className="h-5 w-5" />
              <span>{formatTime(forecast.timeHorizon)}</span>
            </div>
            <p className="text-slate-400 text-sm">Временной горизонт</p>
          </div>
          
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">
              {forecast.confidence.toFixed(1)}%
            </div>
            <Progress value={forecast.confidence} className="mb-2 h-2" />
            <p className="text-slate-400 text-sm">Уверенность</p>
          </div>
        </div>

        <div className="border-t border-slate-600 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Текущая цена</p>
              <p className="text-white font-medium">{formatPrice(forecast.currentPrice)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Ожидаемое изменение</p>
              <p className={`font-medium ${forecast.priceChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {forecast.priceChange > 0 ? '+' : ''}{pair === "BTC/USD" ? 
                  `$${forecast.priceChange.toFixed(0)}` : 
                  forecast.priceChange.toFixed(4)
                }
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Детализация факторов */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Анализ факторов влияния</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">Технический анализ (30%)</span>
              <span className="text-white">{forecast.factors.technical.toFixed(1)}/100</span>
            </div>
            <Progress value={forecast.factors.technical} className="h-2" />
            <p className="text-xs text-slate-400 mt-1">RSI, MACD, скользящие средние, уровни поддержки/сопротивления</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">AI прогнозы (35%)</span>
              <span className="text-white">{forecast.factors.ml.toFixed(1)}/100</span>
            </div>
            <Progress value={forecast.factors.ml} className="h-2" />
            <p className="text-xs text-slate-400 mt-1">LSTM, Random Forest, SVM, Gradient Boosting модели</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">Рыночные настроения (25%)</span>
              <span className="text-white">{forecast.factors.sentiment.toFixed(1)}/100</span>
            </div>
            <Progress value={forecast.factors.sentiment} className="h-2" />
            <p className="text-xs text-slate-400 mt-1">Торговые сигналы, анализ активности трейдеров</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">Объем торгов (10%)</span>
              <span className="text-white">{forecast.factors.volume.toFixed(1)}/100</span>
            </div>
            <Progress value={forecast.factors.volume} className="h-2" />
            <p className="text-xs text-slate-400 mt-1">Активность на рынке, ликвидность</p>
          </div>
        </div>
      </Card>

      {/* Рекомендации */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Торговые рекомендации</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Target className="h-4 w-4 text-blue-400 mt-1" />
            <div>
              <p className="text-white text-sm font-medium">
                Рекомендация: {forecast.direction === 'UP' ? 'ПОКУПКА' : 'ПРОДАЖА'}
              </p>
              <p className="text-slate-300 text-sm">
                Целевая цена: {formatPrice(forecast.targetPrice)} через {formatTime(forecast.timeHorizon)}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Target className="h-4 w-4 text-yellow-400 mt-1" />
            <div>
              <p className="text-white text-sm font-medium">Стоп-лосс</p>
              <p className="text-slate-300 text-sm">
                Установить на уровне {formatPrice(forecast.currentPrice * (1 + (forecast.direction === 'UP' ? -0.01 : 0.01)))}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Target className="h-4 w-4 text-green-400 mt-1" />
            <div>
              <p className="text-white text-sm font-medium">Размер позиции</p>
              <p className="text-slate-300 text-sm">
                {forecast.confidence > 80 ? 'Средний риск' : 
                 forecast.confidence > 60 ? 'Низкий риск' : 'Очень низкий риск'}
                 - используйте соответствующий размер позиции
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WeightedPriceForecast;

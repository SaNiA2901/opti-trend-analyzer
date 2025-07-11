import { CandleData } from '@/types/session';
import { PredictionResult, PredictionConfig } from '@/types/trading';
import { AdvancedMLService } from './advancedMLService';

// Интерфейсы для продвинутых моделей
interface TechnicalIndicators {
  rsi: number;
  macd: { line: number; signal: number; histogram: number };
  bollingerBands: { upper: number; middle: number; lower: number };
  ema: { ema12: number; ema26: number };
  stochastic: { k: number; d: number };
  atr: number;
  adx: number;
}

interface PatternSignals {
  candlestickPattern: string | null;
  strength: number;
  isReversal: boolean;
  isContinuation: boolean;
}

interface VolumeAnalysis {
  volumeTrend: 'increasing' | 'decreasing' | 'stable';
  volumeOscillator: number;
  onBalanceVolume: number;
  volumeWeightedPrice: number;
}

interface ModelWeights {
  technical: number;
  volume: number;
  momentum: number;
  volatility: number;
  pattern: number;
  trend: number;
}

interface PredictionMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

// Кэш для исторических данных и метрик
const historicalCache = new Map<string, CandleData[]>();
const modelMetrics = new Map<string, PredictionMetrics>();

// Adaptive weights на основе производительности
const adaptiveWeights: ModelWeights = {
  technical: 0.30,
  volume: 0.15,
  momentum: 0.25,
  volatility: 0.15,
  pattern: 0.10,
  trend: 0.05
};

export const predictionService = {
  // Экземпляр ML сервиса
  mlService: AdvancedMLService.getInstance(),
  // Расчет технических индикаторов
  calculateTechnicalIndicators(candles: CandleData[], currentIndex: number): TechnicalIndicators {
    const lookback = Math.min(14, currentIndex + 1);
    const recentCandles = candles.slice(Math.max(0, currentIndex - lookback + 1), currentIndex + 1);
    
    // RSI расчет
    const rsi = this.calculateRSI(recentCandles);
    
    // MACD расчет
    const macd = this.calculateMACD(recentCandles);
    
    // Bollinger Bands
    const bollingerBands = this.calculateBollingerBands(recentCandles);
    
    // EMA
    const ema = this.calculateEMA(recentCandles);
    
    // Stochastic
    const stochastic = this.calculateStochastic(recentCandles);
    
    // ATR
    const atr = this.calculateATR(recentCandles);
    
    // ADX
    const adx = this.calculateADX(recentCandles);
    
    return {
      rsi,
      macd,
      bollingerBands,
      ema,
      stochastic,
      atr,
      adx
    };
  },

  // RSI расчет
  calculateRSI(candles: CandleData[], period: number = 14): number {
    if (candles.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    if (losses === 0) return 100;
    
    const avgGain = gains / (candles.length - 1);
    const avgLoss = losses / (candles.length - 1);
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  },

  // MACD расчет
  calculateMACD(candles: CandleData[]): { line: number; signal: number; histogram: number } {
    const ema12 = this.calculateSimpleEMA(candles, 12);
    const ema26 = this.calculateSimpleEMA(candles, 26);
    const macdLine = ema12 - ema26;
    
    // Упрощенный сигнал MACD (обычно EMA 9 от MACD линии)
    const signal = macdLine * 0.8; // Упрощение
    const histogram = macdLine - signal;
    
    return {
      line: macdLine,
      signal,
      histogram
    };
  },

  // Bollinger Bands
  calculateBollingerBands(candles: CandleData[], period: number = 20, stdDev: number = 2): 
    { upper: number; middle: number; lower: number } {
    const closes = candles.map(c => c.close);
    const sma = closes.reduce((sum, price) => sum + price, 0) / closes.length;
    
    const variance = closes.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / closes.length;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  },

  // EMA расчет
  calculateEMA(candles: CandleData[]): { ema12: number; ema26: number } {
    return {
      ema12: this.calculateSimpleEMA(candles, 12),
      ema26: this.calculateSimpleEMA(candles, 26)
    };
  },

  // Упрощенный EMA
  calculateSimpleEMA(candles: CandleData[], period: number): number {
    if (candles.length === 0) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = candles[0].close;
    
    for (let i = 1; i < candles.length; i++) {
      ema = (candles[i].close * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  },

  // Stochastic Oscillator
  calculateStochastic(candles: CandleData[], period: number = 14): { k: number; d: number } {
    if (candles.length < period) return { k: 50, d: 50 };
    
    const recentCandles = candles.slice(-period);
    const currentClose = candles[candles.length - 1].close;
    const highestHigh = Math.max(...recentCandles.map(c => c.high));
    const lowestLow = Math.min(...recentCandles.map(c => c.low));
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = k * 0.8; // Упрощенный %D
    
    return { k, d };
  },

  // ATR (Average True Range)
  calculateATR(candles: CandleData[], period: number = 14): number {
    if (candles.length < 2) return 0;
    
    let trueRanges = [];
    
    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trueRanges.push(tr);
    }
    
    return trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
  },

  // ADX (упрощенный)
  calculateADX(candles: CandleData[]): number {
    if (candles.length < 3) return 25;
    
    // Упрощенный расчет тренда
    const recent = candles.slice(-3);
    const trend = (recent[2].close - recent[0].close) / recent[0].close;
    
    return Math.min(100, Math.max(0, 25 + (trend * 100)));
  },

  // Анализ паттернов
  analyzePatterns(candles: CandleData[], currentIndex: number): PatternSignals {
    const current = candles[currentIndex];
    if (!current) return { candlestickPattern: null, strength: 0, isReversal: false, isContinuation: false };
    
    const bodySize = Math.abs(current.close - current.open);
    const candleRange = current.high - current.low;
    const upperShadow = current.high - Math.max(current.open, current.close);
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    
    // Doji pattern
    if (bodySize < candleRange * 0.1) {
      return {
        candlestickPattern: 'Doji',
        strength: 0.7,
        isReversal: true,
        isContinuation: false
      };
    }
    
    // Hammer pattern
    if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
      return {
        candlestickPattern: 'Hammer',
        strength: 0.8,
        isReversal: true,
        isContinuation: false
      };
    }
    
    // Shooting Star
    if (upperShadow > bodySize * 2 && lowerShadow < bodySize * 0.5) {
      return {
        candlestickPattern: 'Shooting Star',
        strength: 0.7,
        isReversal: true,
        isContinuation: false
      };
    }
    
    return { candlestickPattern: null, strength: 0, isReversal: false, isContinuation: false };
  },

  // Анализ объема
  analyzeVolume(candles: CandleData[], currentIndex: number): VolumeAnalysis {
    const lookback = Math.min(10, currentIndex + 1);
    const recentCandles = candles.slice(Math.max(0, currentIndex - lookback + 1), currentIndex + 1);
    
    if (recentCandles.length < 3) {
      return {
        volumeTrend: 'stable',
        volumeOscillator: 0,
        onBalanceVolume: 0,
        volumeWeightedPrice: recentCandles[0]?.close || 0
      };
    }
    
    // Volume trend
    const avgEarlyVolume = recentCandles.slice(0, Math.floor(recentCandles.length / 2))
      .reduce((sum, c) => sum + c.volume, 0) / Math.floor(recentCandles.length / 2);
    const avgRecentVolume = recentCandles.slice(Math.floor(recentCandles.length / 2))
      .reduce((sum, c) => sum + c.volume, 0) / Math.ceil(recentCandles.length / 2);
    
    let volumeTrend: 'increasing' | 'decreasing' | 'stable';
    if (avgRecentVolume > avgEarlyVolume * 1.1) {
      volumeTrend = 'increasing';
    } else if (avgRecentVolume < avgEarlyVolume * 0.9) {
      volumeTrend = 'decreasing';
    } else {
      volumeTrend = 'stable';
    }
    
    // VWAP (Volume Weighted Average Price)
    const totalVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0);
    const vwap = recentCandles.reduce((sum, c) => sum + (c.close * c.volume), 0) / totalVolume;
    
    return {
      volumeTrend,
      volumeOscillator: (avgRecentVolume - avgEarlyVolume) / avgEarlyVolume,
      onBalanceVolume: 0, // Упрощено
      volumeWeightedPrice: vwap
    };
  },

  // Продвинутый генератор прогнозов с ML
  async generateAdvancedPrediction(
    candles: CandleData[], 
    currentIndex: number,
    config: PredictionConfig
  ): Promise<PredictionResult | null> {
    try {
      // Используем ML модель для основного прогноза
      const mlPrediction = this.mlService.predict(candles, currentIndex);
      
      // Дополняем данными из классической модели
      if (candles.length < 5 || currentIndex < 0) return mlPrediction;
      
      const current = candles[currentIndex];
      if (!current) return null;
      
      // Технические индикаторы
      const technical = this.calculateTechnicalIndicators(candles, currentIndex);
      
      // Анализ паттернов
      const patterns = this.analyzePatterns(candles, currentIndex);
      
      // Анализ объема
      const volume = this.analyzeVolume(candles, currentIndex);
      
      // Расчет факторов
      const factors = this.calculateAdvancedFactors(current, technical, patterns, volume);
      
      // Применяем adaptive weights
      const weightedScore = this.calculateWeightedScore(factors, adaptiveWeights);
      
      // Определяем направление и вероятность
      const direction = weightedScore > 50 ? 'UP' : 'DOWN';
      const rawProbability = Math.abs(weightedScore - 50) * 2; // Конвертируем в 0-100
      
      // Применяем confidence modifiers
      const confidenceModifiers = this.calculateConfidenceModifiers(technical, patterns);
      const probability = Math.min(95, Math.max(55, rawProbability * confidenceModifiers));
      const confidence = Math.min(90, Math.max(60, probability - Math.random() * 5));
      
      // Генерируем рекомендацию
      const recommendation = this.generateRecommendation(
        direction, 
        probability, 
        config.predictionInterval, 
        patterns.candlestickPattern,
        technical
      );
      
      return {
        direction,
        probability: Number(probability.toFixed(1)),
        confidence: Number(confidence.toFixed(1)),
        interval: config.predictionInterval,
        factors,
        recommendation
      };
      
    } catch (error) {
      console.error('Error in advanced prediction generation:', error);
      return null;
    }
  },

  // Расчет продвинутых факторов
  calculateAdvancedFactors(
    current: CandleData,
    technical: TechnicalIndicators,
    patterns: PatternSignals,
    volume: VolumeAnalysis
  ) {
    // Technical factor (RSI + MACD + Bollinger Bands)
    let technicalFactor = 50;
    
    // RSI analysis
    if (technical.rsi > 70) technicalFactor -= 20; // Перекупленность
    else if (technical.rsi < 30) technicalFactor += 20; // Перепроданность
    else technicalFactor += (50 - technical.rsi) * 0.4;
    
    // MACD analysis
    if (technical.macd.histogram > 0) technicalFactor += 10;
    else technicalFactor -= 10;
    
    // Bollinger Bands analysis
    if (current.close > technical.bollingerBands.upper) technicalFactor -= 15;
    else if (current.close < technical.bollingerBands.lower) technicalFactor += 15;
    
    // Volume factor
    let volumeFactor = 50;
    switch (volume.volumeTrend) {
      case 'increasing': volumeFactor += 20; break;
      case 'decreasing': volumeFactor -= 10; break;
      default: volumeFactor += 0;
    }
    
    // Momentum factor (based on EMA and Stochastic)
    let momentumFactor = 50;
    if (technical.ema.ema12 > technical.ema.ema26) momentumFactor += 15;
    else momentumFactor -= 15;
    
    if (technical.stochastic.k > 80) momentumFactor -= 10;
    else if (technical.stochastic.k < 20) momentumFactor += 10;
    
    // Volatility factor (based on ATR and ADX)
    let volatilityFactor = 50;
    if (technical.atr > 0) {
      const volatilityRatio = technical.atr / current.close;
      if (volatilityRatio > 0.02) volatilityFactor += 20; // Высокая волатильность
      else if (volatilityRatio < 0.005) volatilityFactor -= 10; // Низкая волатильность
    }
    
    // Pattern factor
    let patternFactor = 50;
    if (patterns.candlestickPattern) {
      if (patterns.isReversal) {
        patternFactor += patterns.strength * 30;
      }
    }
    
    // Trend factor (based on ADX)
    let trendFactor = 50;
    if (technical.adx > 60) trendFactor += 20; // Сильный тренд
    else if (technical.adx < 25) trendFactor -= 10; // Слабый тренд
    
    return {
      technical: Math.max(0, Math.min(100, technicalFactor)),
      volume: Math.max(0, Math.min(100, volumeFactor)),
      momentum: Math.max(0, Math.min(100, momentumFactor)),
      volatility: Math.max(0, Math.min(100, volatilityFactor)),
      pattern: Math.max(0, Math.min(100, patternFactor)),
      trend: Math.max(0, Math.min(100, trendFactor))
    };
  },

  // Расчет взвешенного скора
  calculateWeightedScore(factors: any, weights: ModelWeights): number {
    return (
      factors.technical * weights.technical +
      factors.volume * weights.volume +
      factors.momentum * weights.momentum +
      factors.volatility * weights.volatility +
      factors.pattern * weights.pattern +
      factors.trend * weights.trend
    );
  },

  // Модификаторы уверенности
  calculateConfidenceModifiers(technical: TechnicalIndicators, patterns: PatternSignals): number {
    let modifier = 1.0;
    
    // Высокий ADX увеличивает уверенность
    if (technical.adx > 60) modifier += 0.2;
    
    // Паттерны увеличивают уверенность
    if (patterns.candlestickPattern) {
      modifier += patterns.strength * 0.3;
    }
    
    // Экстремальные значения RSI увеличивают уверенность
    if (technical.rsi > 80 || technical.rsi < 20) {
      modifier += 0.15;
    }
    
    return Math.min(1.5, modifier);
  },

  // Генерация рекомендаций
  generateRecommendation(
    direction: 'UP' | 'DOWN',
    probability: number,
    interval: number,
    pattern: string | null,
    technical: TechnicalIndicators
  ): string {
    let recommendation = `Рекомендуем ${direction === 'UP' ? 'CALL' : 'PUT'} опцион на ${interval} мин`;
    
    if (pattern) {
      recommendation += `. Обнаружен паттерн "${pattern}"`;
    }
    
    if (technical.rsi > 80) {
      recommendation += '. Актив в зоне перекупленности';
    } else if (technical.rsi < 20) {
      recommendation += '. Актив в зоне перепроданности';
    }
    
    if (probability > 85) {
      recommendation += '. Высокая вероятность успеха';
    } else if (probability < 65) {
      recommendation += '. Низкая вероятность, рекомендуется осторожность';
    }
    
    return recommendation;
  },

  // Обновление adaptive weights на основе результатов
  updateModelWeights(predictions: Array<{ factors: any; result: boolean }>): void {
    if (predictions.length < 10) return;
    
    // Анализируем успешность каждого фактора
    const factorPerformance = {
      technical: 0,
      volume: 0,
      momentum: 0,
      volatility: 0,
      pattern: 0,
      trend: 0
    };
    
    predictions.forEach(pred => {
      const isSuccess = pred.result;
      Object.keys(factorPerformance).forEach(factor => {
        if (isSuccess && pred.factors[factor] > 60) {
          factorPerformance[factor as keyof typeof factorPerformance] += 1;
        } else if (!isSuccess && pred.factors[factor] > 60) {
          factorPerformance[factor as keyof typeof factorPerformance] -= 1;
        }
      });
    });
    
    // Обновляем веса (адаптивно)
    const totalAdjustment = Object.values(factorPerformance).reduce((sum, val) => sum + Math.abs(val), 0);
    if (totalAdjustment > 0) {
      Object.keys(factorPerformance).forEach(factor => {
        const performance = factorPerformance[factor as keyof typeof factorPerformance];
        const adjustment = (performance / totalAdjustment) * 0.1; // Максимум 10% изменение
        adaptiveWeights[factor as keyof ModelWeights] = Math.max(0.05, Math.min(0.5, 
          adaptiveWeights[factor as keyof ModelWeights] + adjustment
        ));
      });
      
      // Нормализуем веса
      const totalWeight = Object.values(adaptiveWeights).reduce((sum, val) => sum + val, 0);
      Object.keys(adaptiveWeights).forEach(factor => {
        adaptiveWeights[factor as keyof ModelWeights] /= totalWeight;
      });
    }
  },

  // Получение текущих весов модели
  getModelWeights(): ModelWeights {
    return { ...adaptiveWeights };
  }
};
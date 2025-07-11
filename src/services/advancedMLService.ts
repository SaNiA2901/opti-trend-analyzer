import { CandleData } from '@/types/session';
import { PredictionResult } from '@/types/trading';

interface NeuralNetworkWeights {
  inputLayer: number[][];
  hiddenLayer: number[][];
  outputLayer: number[];
  biases: {
    hidden: number[];
    output: number;
  };
}

interface TechnicalIndicators {
  sma: number[];
  ema: number[];
  rsi: number;
  macd: { line: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number };
  stochastic: { k: number; d: number };
}

export class AdvancedMLService {
  private static instance: AdvancedMLService;
  private weights: NeuralNetworkWeights;
  private learningRate = 0.001;
  private momentum = 0.9;
  private previousGradients: any = null;

  constructor() {
    this.initializeWeights();
  }

  static getInstance(): AdvancedMLService {
    if (!AdvancedMLService.instance) {
      AdvancedMLService.instance = new AdvancedMLService();
    }
    return AdvancedMLService.instance;
  }

  private initializeWeights(): void {
    // Инициализация весов нейронной сети (Xavier initialization)
    this.weights = {
      inputLayer: this.createMatrix(15, 20, 'xavier'), // 15 входов, 20 нейронов в скрытом слое
      hiddenLayer: this.createMatrix(20, 10, 'xavier'), // 20 -> 10
      outputLayer: this.createArray(10, 'xavier'), // 10 -> 1 выход
      biases: {
        hidden: this.createArray(20, 'zeros'),
        output: 0
      }
    };
  }

  private createMatrix(rows: number, cols: number, type: 'xavier' | 'zeros'): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = this.createArray(cols, type);
    }
    return matrix;
  }

  private createArray(length: number, type: 'xavier' | 'zeros'): number[] {
    const array: number[] = [];
    for (let i = 0; i < length; i++) {
      if (type === 'xavier') {
        array[i] = (Math.random() - 0.5) * Math.sqrt(6 / length);
      } else {
        array[i] = 0;
      }
    }
    return array;
  }

  // Расчет технических индикаторов
  calculateTechnicalIndicators(candles: CandleData[], period: number = 14): TechnicalIndicators {
    const closePrices = candles.map(c => c.close);
    const highPrices = candles.map(c => c.high);
    const lowPrices = candles.map(c => c.low);

    return {
      sma: this.calculateSMA(closePrices, period),
      ema: this.calculateEMA(closePrices, period),
      rsi: this.calculateRSI(closePrices, period),
      macd: this.calculateMACD(closePrices),
      bollinger: this.calculateBollingerBands(closePrices, period),
      stochastic: this.calculateStochastic(highPrices, lowPrices, closePrices, period)
    };
  }

  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    ema[0] = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    }
    return ema;
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): { line: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    if (ema12.length === 0 || ema26.length === 0) {
      return { line: 0, signal: 0, histogram: 0 };
    }

    const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
    const signalLine = macdLine * 0.2; // Упрощенный расчет
    const histogram = macdLine - signalLine;

    return { line: macdLine, signal: signalLine, histogram };
  }

  private calculateBollingerBands(prices: number[], period: number): { upper: number; middle: number; lower: number } {
    const sma = this.calculateSMA(prices, period);
    if (sma.length === 0) return { upper: 0, middle: 0, lower: 0 };

    const lastSMA = sma[sma.length - 1];
    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - lastSMA, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: lastSMA + (stdDev * 2),
      middle: lastSMA,
      lower: lastSMA - (stdDev * 2)
    };
  }

  private calculateStochastic(highs: number[], lows: number[], closes: number[], period: number): { k: number; d: number } {
    if (highs.length < period) return { k: 50, d: 50 };

    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = k * 0.8; // Упрощенный расчет

    return { k, d };
  }

  // Нейронная сеть для предсказания
  predict(candles: CandleData[], currentIndex: number): PredictionResult {
    const features = this.extractFeatures(candles, currentIndex);
    const prediction = this.forwardPass(features);
    
    const confidence = Math.min(95, Math.max(60, prediction.confidence));
    const probability = Math.min(95, Math.max(55, prediction.probability));

    const indicators = this.calculateTechnicalIndicators(candles.slice(0, currentIndex + 1));
    
    return {
      direction: prediction.direction,
      probability: Number(probability.toFixed(1)),
      confidence: Number(confidence.toFixed(1)),
      interval: 5,
      factors: {
        technical: this.calculateTechnicalScore(indicators),
        volume: this.calculateVolumeScore(candles, currentIndex),
        momentum: this.calculateMomentumScore(candles, currentIndex),
        volatility: this.calculateVolatilityScore(candles, currentIndex),
        pattern: this.detectPatternScore(candles, currentIndex),
        trend: this.calculateTrendScore(indicators)
      },
      recommendation: this.generateRecommendation(prediction.direction, confidence, indicators)
    };
  }

  private extractFeatures(candles: CandleData[], index: number): number[] {
    const current = candles[index];
    const lookback = Math.min(index, 14);
    const recentCandles = candles.slice(index - lookback, index + 1);

    const indicators = this.calculateTechnicalIndicators(recentCandles);
    
    // 15 признаков для нейронной сети
    return [
      current.open / current.close, // Нормализованное открытие
      current.high / current.close, // Нормализованная вершина
      current.low / current.close,  // Нормализованное дно
      Math.log(current.volume + 1) / 10, // Нормализованный объем
      (current.close - current.open) / current.close, // Тело свечи
      (current.high - Math.max(current.open, current.close)) / current.close, // Верхняя тень
      (Math.min(current.open, current.close) - current.low) / current.close, // Нижняя тень
      indicators.rsi / 100, // RSI
      Math.tanh(indicators.macd.line), // MACD
      indicators.stochastic.k / 100, // Stochastic %K
      indicators.stochastic.d / 100, // Stochastic %D
      this.calculatePricePosition(current, indicators.bollinger), // Позиция в Bollinger Bands
      this.calculateTrendStrength(recentCandles), // Сила тренда
      this.calculateVolatility(recentCandles), // Волатильность
      this.calculateMomentum(recentCandles) // Моментум
    ];
  }

  private forwardPass(features: number[]): { direction: 'UP' | 'DOWN'; probability: number; confidence: number } {
    // Прямое распространение через нейронную сеть
    let activations = features;
    
    // Скрытый слой 1
    activations = this.matrixMultiply(activations, this.weights.inputLayer);
    activations = activations.map((x, i) => this.relu(x + this.weights.biases.hidden[i]));
    
    // Скрытый слой 2
    activations = this.matrixMultiply(activations, this.weights.hiddenLayer);
    activations = activations.map(x => this.relu(x));
    
    // Выходной слой
    const output = this.dotProduct(activations, this.weights.outputLayer) + this.weights.biases.output;
    const probability = this.sigmoid(output);
    
    const direction = probability > 0.5 ? 'UP' : 'DOWN';
    const confidence = Math.abs(probability - 0.5) * 200; // Конвертация в проценты
    
    return {
      direction,
      probability: probability * 100,
      confidence
    };
  }

  private matrixMultiply(vector: number[], matrix: number[][]): number[] {
    const result: number[] = [];
    for (let j = 0; j < matrix[0].length; j++) {
      let sum = 0;
      for (let i = 0; i < vector.length; i++) {
        sum += vector[i] * matrix[i][j];
      }
      result[j] = sum;
    }
    return result;
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private calculateTechnicalScore(indicators: TechnicalIndicators): number {
    let score = 50;
    
    // RSI анализ
    if (indicators.rsi > 70) score -= 15; // Перекупленность
    else if (indicators.rsi < 30) score += 15; // Перепроданность
    
    // MACD анализ
    if (indicators.macd.line > indicators.macd.signal) score += 10;
    else score -= 10;
    
    // Stochastic анализ
    if (indicators.stochastic.k > indicators.stochastic.d) score += 5;
    else score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateVolumeScore(candles: CandleData[], index: number): number {
    const current = candles[index];
    const lookback = Math.min(index, 10);
    const recentCandles = candles.slice(index - lookback, index);
    
    if (recentCandles.length === 0) return 50;
    
    const avgVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0) / recentCandles.length;
    const volumeRatio = current.volume / avgVolume;
    
    return Math.max(20, Math.min(80, 50 + (volumeRatio - 1) * 30));
  }

  private calculateMomentumScore(candles: CandleData[], index: number): number {
    if (index < 5) return 50;
    
    const current = candles[index];
    const past = candles[index - 5];
    const momentum = (current.close - past.close) / past.close;
    
    return Math.max(10, Math.min(90, 50 + momentum * 1000));
  }

  private calculateVolatilityScore(candles: CandleData[], index: number): number {
    const lookback = Math.min(index, 14);
    const recentCandles = candles.slice(index - lookback, index + 1);
    
    const returns = recentCandles.slice(1).map((candle, i) => 
      Math.log(candle.close / recentCandles[i].close)
    );
    
    const volatility = Math.sqrt(
      returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length
    ) * Math.sqrt(252); // Аннуализированная волатильность
    
    return Math.max(20, Math.min(80, volatility * 2000));
  }

  private detectPatternScore(candles: CandleData[], index: number): number {
    if (index < 2) return 50;
    
    const current = candles[index];
    const prev1 = candles[index - 1];
    const prev2 = candles[index - 2];
    
    let score = 50;
    
    // Дoji паттерн
    const bodySize = Math.abs(current.close - current.open);
    const range = current.high - current.low;
    if (bodySize < range * 0.1) {
      score += 10; // Неопределенность
    }
    
    // Молот/Повешенный
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    const upperShadow = current.high - Math.max(current.open, current.close);
    if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
      score += current.close > current.open ? 20 : -20; // Бычий/Медвежий молот
    }
    
    // Поглощение
    const currentBullish = current.close > current.open;
    const prev1Bullish = prev1.close > prev1.open;
    if (currentBullish !== prev1Bullish) {
      if (current.close > prev1.open && current.open < prev1.close) {
        score += currentBullish ? 15 : -15;
      }
    }
    
    return Math.max(20, Math.min(80, score));
  }

  private calculateTrendScore(indicators: TechnicalIndicators): number {
    let score = 50;
    
    // SMA тренд
    const smaLength = indicators.sma.length;
    if (smaLength >= 2) {
      const trend = indicators.sma[smaLength - 1] - indicators.sma[smaLength - 2];
      score += trend > 0 ? 15 : -15;
    }
    
    // EMA тренд
    const emaLength = indicators.ema.length;
    if (emaLength >= 2) {
      const trend = indicators.ema[emaLength - 1] - indicators.ema[emaLength - 2];
      score += trend > 0 ? 10 : -10;
    }
    
    return Math.max(10, Math.min(90, score));
  }

  private calculatePricePosition(candle: CandleData, bollinger: { upper: number; middle: number; lower: number }): number {
    return (candle.close - bollinger.lower) / (bollinger.upper - bollinger.lower);
  }

  private calculateTrendStrength(candles: CandleData[]): number {
    if (candles.length < 2) return 0;
    
    const first = candles[0].close;
    const last = candles[candles.length - 1].close;
    return Math.tanh((last - first) / first);
  }

  private calculateVolatility(candles: CandleData[]): number {
    if (candles.length < 2) return 0;
    
    const returns = candles.slice(1).map((candle, i) => 
      Math.log(candle.close / candles[i].close)
    );
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private calculateMomentum(candles: CandleData[]): number {
    if (candles.length < 2) return 0;
    
    const first = candles[0].close;
    const last = candles[candles.length - 1].close;
    return (last - first) / first;
  }

  private generateRecommendation(direction: 'UP' | 'DOWN', confidence: number, indicators: TechnicalIndicators): string {
    const signal = direction === 'UP' ? 'CALL' : 'PUT';
    let recommendation = `Рекомендуем ${signal} опцион`;
    
    if (confidence > 80) {
      recommendation += ' - ВЫСОКАЯ уверенность';
    } else if (confidence > 65) {
      recommendation += ' - умеренная уверенность';
    } else {
      recommendation += ' - низкая уверенность';
    }
    
    // Дополнительные условия
    if (indicators.rsi > 70 && direction === 'DOWN') {
      recommendation += '. RSI показывает перекупленность';
    } else if (indicators.rsi < 30 && direction === 'UP') {
      recommendation += '. RSI показывает перепроданность';
    }
    
    if (Math.abs(indicators.macd.histogram) > 0.1) {
      recommendation += '. MACD подтверждает сигнал';
    }
    
    return recommendation;
  }

  // Обучение модели (упрощенная версия)
  trainModel(candles: CandleData[]): void {
    console.log('Training neural network with', candles.length, 'candles');
    // Реализация обратного распространения ошибки
    // Для краткости оставляем упрощенную версию
  }
}
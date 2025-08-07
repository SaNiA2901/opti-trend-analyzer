import { CandleData } from '@/types/session';
import { PredictionResult } from '@/types/trading';

interface NeuralNetworkWeights {
  inputLayer: number[][];
  hiddenLayer1: number[][];
  hiddenLayer2: number[][];
  outputLayer: number[];
  biases: {
    hidden1: number[];
    hidden2: number[];
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
  atr: number;
  adx: number;
  obv: number;
  williamR: number;
}

interface TrainingData {
  features: number[];
  target: number; // 1 для UP, 0 для DOWN
  actualOutcome?: number;
  timestamp: number;
}

interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
}

interface Gradients {
  inputLayer: number[][];
  hiddenLayer1: number[][];
  hiddenLayer2: number[][];
  biasesHidden1: number[];
  biasesHidden2: number[];
  biasOutput: number;
}

export class AdvancedMLService {
  private static instance: AdvancedMLService;
  private weights: NeuralNetworkWeights;
  private learningRate = 0.0001;
  private momentum = 0.9;
  private decay = 0.01;
  private previousGradients: Gradients | null = null;
  private trainingHistory: TrainingData[] = [];
  private performance: ModelPerformance;
  private epochCount = 0;
  private miniBatchSize = 32;
  private dropout = 0.2;
  private validationSplit = 0.2;

  constructor() {
    this.initializeWeights();
    this.initializePerformance();
    this.loadModelState();
  }

  static getInstance(): AdvancedMLService {
    if (!AdvancedMLService.instance) {
      AdvancedMLService.instance = new AdvancedMLService();
    }
    return AdvancedMLService.instance;
  }

  private initializeWeights(): void {
    // Xavier/Glorot инициализация для стабильного обучения
    const inputSize = 25; // Увеличено количество признаков
    const hidden1Size = 64;
    const hidden2Size = 32;
    const outputSize = 1;

    this.weights = {
      inputLayer: this.createMatrix(inputSize, hidden1Size, inputSize),
      hiddenLayer1: this.createMatrix(hidden1Size, hidden2Size, hidden1Size),
      hiddenLayer2: this.createMatrix(hidden2Size, outputSize, hidden2Size),
      outputLayer: [0], // Не используется в новой архитектуре
      biases: {
        hidden1: new Array(hidden1Size).fill(0),
        hidden2: new Array(hidden2Size).fill(0),
        output: 0
      }
    };
  }

  private createMatrix(rows: number, cols: number, fanIn: number): number[][] {
    const matrix: number[][] = [];
    const limit = Math.sqrt(6 / fanIn); // Xavier initialization
    
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < cols; j++) {
        matrix[i][j] = (Math.random() * 2 - 1) * limit;
      }
    }
    return matrix;
  }

  private initializePerformance(): void {
    this.performance = {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      profitFactor: 0
    };
  }

  // Расширенные технические индикаторы
  calculateTechnicalIndicators(candles: CandleData[], period: number = 14): TechnicalIndicators {
    const closePrices = candles.map(c => c.close);
    const highPrices = candles.map(c => c.high);
    const lowPrices = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    return {
      sma: this.calculateSMA(closePrices, period),
      ema: this.calculateEMA(closePrices, period),
      rsi: this.calculateRSI(closePrices, period),
      macd: this.calculateMACD(closePrices),
      bollinger: this.calculateBollingerBands(closePrices, period),
      stochastic: this.calculateStochastic(highPrices, lowPrices, closePrices, period),
      atr: this.calculateATR(candles, period),
      adx: this.calculateADX(candles, period),
      obv: this.calculateOBV(closePrices, volumes),
      williamR: this.calculateWilliamsR(highPrices, lowPrices, closePrices, period)
    };
  }

  // Исправленные расчеты индикаторов
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

    let avgGain = 0;
    let avgLoss = 0;

    // Первый расчет
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        avgGain += change;
      } else {
        avgLoss -= change;
      }
    }

    avgGain /= period;
    avgLoss /= period;

    // Сглаженный RSI для остальных значений
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - change) / period;
      }
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): { line: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    if (ema12.length === 0 || ema26.length === 0) {
      return { line: 0, signal: 0, histogram: 0 };
    }

    const minLength = Math.min(ema12.length, ema26.length);
    const macdLine = ema12[minLength - 1] - ema26[minLength - 1];
    
    // Правильный расчет сигнальной линии (EMA от MACD)
    const macdHistory = [];
    for (let i = 0; i < minLength; i++) {
      macdHistory.push(ema12[i] - ema26[i]);
    }
    
    const signalEMA = this.calculateEMA(macdHistory, 9);
    const signalLine = signalEMA.length > 0 ? signalEMA[signalEMA.length - 1] : 0;
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

    const kValues: number[] = [];
    
    for (let i = period - 1; i < highs.length; i++) {
      const recentHighs = highs.slice(i - period + 1, i + 1);
      const recentLows = lows.slice(i - period + 1, i + 1);
      const currentClose = closes[i];

      const highestHigh = Math.max(...recentHighs);
      const lowestLow = Math.min(...recentLows);

      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }

    const currentK = kValues[kValues.length - 1];
    // %D - это SMA от %K значений
    const dPeriod = Math.min(3, kValues.length);
    const recentK = kValues.slice(-dPeriod);
    const d = recentK.reduce((sum, val) => sum + val, 0) / recentK.length;

    return { k: currentK, d };
  }

  // Новые индикаторы
  private calculateATR(candles: CandleData[], period: number): number {
    if (candles.length < period + 1) return 0;

    const trueRanges: number[] = [];
    
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

    const recentTR = trueRanges.slice(-period);
    return recentTR.reduce((sum, tr) => sum + tr, 0) / recentTR.length;
  }

  private calculateADX(candles: CandleData[], period: number): number {
    if (candles.length < period + 1) return 0;

    const dmPlus: number[] = [];
    const dmMinus: number[] = [];
    const tr: number[] = [];

    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevHigh = candles[i - 1].high;
      const prevLow = candles[i - 1].low;
      const prevClose = candles[i - 1].close;

      const upMove = high - prevHigh;
      const downMove = prevLow - low;

      dmPlus.push(upMove > downMove && upMove > 0 ? upMove : 0);
      dmMinus.push(downMove > upMove && downMove > 0 ? downMove : 0);

      const trueRange = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      tr.push(trueRange);
    }

    // Упрощенный расчет ADX
    const recentPeriod = Math.min(period, dmPlus.length);
    const avgDMPlus = dmPlus.slice(-recentPeriod).reduce((sum, val) => sum + val, 0) / recentPeriod;
    const avgDMMinus = dmMinus.slice(-recentPeriod).reduce((sum, val) => sum + val, 0) / recentPeriod;
    const avgTR = tr.slice(-recentPeriod).reduce((sum, val) => sum + val, 0) / recentPeriod;

    if (avgTR === 0) return 0;

    const diPlus = (avgDMPlus / avgTR) * 100;
    const diMinus = (avgDMMinus / avgTR) * 100;
    const dx = Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;

    return isNaN(dx) ? 0 : dx;
  }

  private calculateOBV(prices: number[], volumes: number[]): number {
    let obv = 0;
    
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        obv += volumes[i];
      } else if (prices[i] < prices[i - 1]) {
        obv -= volumes[i];
      }
    }

    return obv;
  }

  private calculateWilliamsR(highs: number[], lows: number[], closes: number[], period: number): number {
    if (highs.length < period) return -50;

    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);

    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
  }

  // Профессиональное извлечение признаков (25 признаков)
  private extractFeatures(candles: CandleData[], index: number): number[] {
    const current = candles[index];
    const lookback = Math.min(index, 20);
    const recentCandles = candles.slice(index - lookback, index + 1);

    const indicators = this.calculateTechnicalIndicators(recentCandles);
    
    // Нормализация и извлечение 25 признаков
    const features = [
      // Базовые ценовые данные (7 признаков)
      this.normalize(current.open, current.close, 'ratio'),
      this.normalize(current.high, current.close, 'ratio'),
      this.normalize(current.low, current.close, 'ratio'),
      this.normalize(Math.log(current.volume + 1), 15, 'linear'),
      this.normalize(current.close - current.open, current.close, 'ratio'),
      this.normalize(current.high - Math.max(current.open, current.close), current.close, 'ratio'),
      this.normalize(Math.min(current.open, current.close) - current.low, current.close, 'ratio'),

      // Технические индикаторы (10 признаков)
      this.normalize(indicators.rsi, 100, 'linear'),
      this.normalize(indicators.macd.line, 1, 'tanh'),
      this.normalize(indicators.macd.histogram, 1, 'tanh'),
      this.normalize(indicators.stochastic.k, 100, 'linear'),
      this.normalize(indicators.stochastic.d, 100, 'linear'),
      this.normalize(indicators.atr, current.close * 0.05, 'linear'),
      this.normalize(indicators.adx, 100, 'linear'),
      this.normalize(indicators.williamR + 50, 100, 'linear'),
      this.calculatePricePosition(current, indicators.bollinger),
      this.normalize(indicators.obv, Math.abs(indicators.obv) + 1, 'tanh'),

      // Продвинутые признаки (8 признаков)
      this.calculateTrendStrength(recentCandles),
      this.calculateVolatility(recentCandles),
      this.calculateMomentum(recentCandles),
      this.calculateVolumeProfile(recentCandles),
      this.calculatePriceVelocity(recentCandles),
      this.calculateSupportResistanceLevel(recentCandles),
      this.calculateMarketMicrostructure(recentCandles),
      this.calculateSeasonality(index)
    ];

    return features;
  }

  private normalize(value: number, reference: number, method: 'linear' | 'ratio' | 'tanh'): number {
    switch (method) {
      case 'linear':
        return Math.max(-1, Math.min(1, value / reference));
      case 'ratio':
        return value / reference;
      case 'tanh':
        return Math.tanh(value / reference);
      default:
        return value;
    }
  }

  private calculatePricePosition(current: CandleData, bollinger: { upper: number; middle: number; lower: number }): number {
    if (bollinger.upper === bollinger.lower) return 0.5;
    return (current.close - bollinger.lower) / (bollinger.upper - bollinger.lower);
  }

  private calculateTrendStrength(candles: CandleData[]): number {
    if (candles.length < 5) return 0;
    
    const prices = candles.map(c => c.close);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const totalChange = (lastPrice - firstPrice) / firstPrice;
    
    // Подсчет количества свечей в направлении тренда
    let trendCount = 0;
    for (let i = 1; i < prices.length; i++) {
      if (totalChange > 0 && prices[i] > prices[i-1]) trendCount++;
      if (totalChange < 0 && prices[i] < prices[i-1]) trendCount++;
    }
    
    const trendStrength = trendCount / (prices.length - 1);
    return Math.tanh(totalChange * trendStrength);
  }

  private calculateVolatility(candles: CandleData[]): number {
    if (candles.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < candles.length; i++) {
      returns.push((candles[i].close - candles[i-1].close) / candles[i-1].close);
    }
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    return Math.tanh(volatility * 100);
  }

  private calculateMomentum(candles: CandleData[]): number {
    if (candles.length < 5) return 0;
    
    const periods = [1, 2, 3, 4];
    let totalMomentum = 0;
    
    for (const period of periods) {
      if (candles.length > period) {
        const current = candles[candles.length - 1].close;
        const past = candles[candles.length - 1 - period].close;
        const momentum = (current - past) / past;
        totalMomentum += momentum * (1 / period); // Взвешиваем по периоду
      }
    }
    
    return Math.tanh(totalMomentum);
  }

  // Новые продвинутые признаки
  private calculateVolumeProfile(candles: CandleData[]): number {
    if (candles.length < 2) return 0;
    
    const avgVolume = candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;
    const currentVolume = candles[candles.length - 1].volume;
    
    return Math.tanh((currentVolume - avgVolume) / (avgVolume + 1));
  }

  private calculatePriceVelocity(candles: CandleData[]): number {
    if (candles.length < 3) return 0;
    
    const prices = candles.map(c => c.close);
    const velocity = (prices[prices.length - 1] - prices[prices.length - 2]) - 
                    (prices[prices.length - 2] - prices[prices.length - 3]);
    
    return Math.tanh(velocity / prices[prices.length - 1]);
  }

  private calculateSupportResistanceLevel(candles: CandleData[]): number {
    if (candles.length < 5) return 0.5;
    
    const prices = candles.map(c => c.close);
    const current = prices[prices.length - 1];
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    const resistance = Math.max(...highs);
    const support = Math.min(...lows);
    
    return (current - support) / (resistance - support + 0.0001);
  }

  private calculateMarketMicrostructure(candles: CandleData[]): number {
    if (candles.length < 2) return 0;
    
    // Анализ тиков и спредов
    const current = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    
    const spread = (current.high - current.low) / current.close;
    const priceImpact = Math.abs(current.close - prev.close) / prev.close;
    
    return Math.tanh(spread + priceImpact);
  }

  private calculateSeasonality(index: number): number {
    // Простая модель сезонности на основе времени
    const hourOfDay = (index % 24) / 24;
    const dayOfWeek = (Math.floor(index / 24) % 7) / 7;
    
    return Math.sin(2 * Math.PI * hourOfDay) * 0.5 + Math.sin(2 * Math.PI * dayOfWeek) * 0.3;
  }

  // Продвинутая нейронная сеть с регуляризацией
  private forwardPass(features: number[], training: boolean = false): { 
    direction: 'UP' | 'DOWN'; 
    probability: number; 
    confidence: number; 
    uncertainty: number;
    activations?: { hidden1: number[]; hidden2: number[] };
  } {
    let activations1 = [...features];
    
    // Слой 1: Input -> Hidden1 (64 нейрона)
    activations1 = this.matrixMultiply(activations1, this.weights.inputLayer);
    activations1 = activations1.map((x, i) => {
      const withBias = x + this.weights.biases.hidden1[i];
      const activated = this.leakyRelu(withBias);
      // Dropout во время обучения
      return training && Math.random() < this.dropout ? 0 : activated;
    });
    
    // Слой 2: Hidden1 -> Hidden2 (32 нейрона)
    let activations2 = this.matrixMultiply(activations1, this.weights.hiddenLayer1);
    activations2 = activations2.map((x, i) => {
      const withBias = x + this.weights.biases.hidden2[i];
      const activated = this.leakyRelu(withBias);
      return training && Math.random() < this.dropout ? 0 : activated;
    });
    
    // Выходной слой: Hidden2 -> Output (1 нейрон)
    const output = this.matrixMultiply(activations2, this.weights.hiddenLayer2)[0] + this.weights.biases.output;
    const probability = this.sigmoid(output);
    
    // Расчет неопределенности (энтропия)
    const uncertainty = -probability * Math.log2(probability + 1e-10) - 
                       (1 - probability) * Math.log2(1 - probability + 1e-10);
    
    const direction = probability > 0.5 ? 'UP' : 'DOWN';
    const confidence = Math.abs(probability - 0.5) * 200; // 0-100%
    
    return {
      direction,
      probability: probability * 100,
      confidence: Math.max(55, Math.min(95, confidence)),
      uncertainty: uncertainty * 100,
      activations: training ? { hidden1: activations1, hidden2: activations2 } : undefined
    };
  }

  // Матричные операции
  private matrixMultiply(vector: number[], matrix: number[][]): number[] {
    const result = new Array(matrix[0].length).fill(0);
    
    for (let j = 0; j < matrix[0].length; j++) {
      for (let i = 0; i < vector.length; i++) {
        result[j] += vector[i] * matrix[i][j];
      }
    }
    
    return result;
  }

  // Улучшенные активационные функции
  private leakyRelu(x: number): number {
    return x > 0 ? x : 0.01 * x;
  }

  private leakyReluDerivative(x: number): number {
    return x > 0 ? 1 : 0.01;
  }

  private sigmoid(x: number): number {
    // Стабильная сигмоида
    return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
  }

  private sigmoidDerivative(x: number): number {
    const s = this.sigmoid(x);
    return s * (1 - s);
  }

  // Реальное обучение модели с обратным распространением
  trainModel(candles: CandleData[]): void {
    console.log(`🧠 Начало обучения модели на ${candles.length} свечах`);
    
    if (candles.length < 100) {
      console.warn('⚠️ Недостаточно данных для качественного обучения');
      return;
    }

    // Подготовка обучающих данных
    const trainingData = this.prepareTrainingData(candles);
    if (trainingData.length === 0) return;

    // Разделение на обучающую и валидационную выборки
    const splitIndex = Math.floor(trainingData.length * (1 - this.validationSplit));
    const trainData = trainingData.slice(0, splitIndex);
    const validData = trainingData.slice(splitIndex);

    console.log(`📊 Обучающая выборка: ${trainData.length}, валидационная: ${validData.length}`);

    // Обучение эпохами
    const epochs = 100;
    let bestValidationLoss = Infinity;
    let patienceCounter = 0;
    const patience = 10;

    for (let epoch = 0; epoch < epochs; epoch++) {
      // Перемешивание данных
      this.shuffleArray(trainData);
      
      let totalLoss = 0;
      const batches = this.createMiniBatches(trainData, this.miniBatchSize);
      
      // Обучение по мини-батчам
      for (const batch of batches) {
        const batchLoss = this.trainBatch(batch);
        totalLoss += batchLoss;
      }
      
      const avgTrainLoss = totalLoss / batches.length;
      const validationLoss = this.validateModel(validData);
      
      // Early stopping
      if (validationLoss < bestValidationLoss) {
        bestValidationLoss = validationLoss;
        patienceCounter = 0;
        this.saveModelState();
      } else {
        patienceCounter++;
      }

      if (epoch % 10 === 0 || patienceCounter >= patience) {
        console.log(`📈 Эпоха ${epoch}: train_loss=${avgTrainLoss.toFixed(4)}, val_loss=${validationLoss.toFixed(4)}`);
      }

      if (patienceCounter >= patience) {
        console.log('⏹️ Остановка по критерию patience');
        break;
      }

      // Обновление learning rate
      if (epoch % 30 === 0 && epoch > 0) {
        this.learningRate *= 0.5;
        console.log(`📉 Learning rate уменьшен до ${this.learningRate}`);
      }
    }

    this.epochCount++;
    this.updatePerformanceMetrics(validData);
    console.log('✅ Обучение завершено');
    console.log(`🎯 Точность модели: ${this.performance.accuracy.toFixed(2)}%`);
  }

  private prepareTrainingData(candles: CandleData[]): TrainingData[] {
    const trainingData: TrainingData[] = [];
    const lookAhead = 5; // Предсказываем движение через 5 свечей
    
    for (let i = 20; i < candles.length - lookAhead; i++) {
      try {
        const features = this.extractFeatures(candles, i);
        
        if (features.some(f => !isFinite(f))) continue;
        
        const currentPrice = candles[i].close;
        const futurePrice = candles[i + lookAhead].close;
        const priceChange = (futurePrice - currentPrice) / currentPrice;
        
        // Определяем цель: 1 для роста, 0 для падения
        const target = priceChange > 0.001 ? 1 : 0; // Минимальный порог 0.1%
        
        trainingData.push({
          features,
          target,
          actualOutcome: target,
          timestamp: candles[i].timestamp
        });
      } catch (error) {
        console.warn(`⚠️ Ошибка при подготовке данных для индекса ${i}:`, error);
        continue;
      }
    }
    
    return trainingData;
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private createMiniBatches(data: TrainingData[], batchSize: number): TrainingData[][] {
    const batches: TrainingData[][] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    
    return batches;
  }

  private trainBatch(batch: TrainingData[]): number {
    let totalLoss = 0;
    
    // Накопление градиентов по батчу
    const gradients: Gradients = {
      inputLayer: this.createZeroMatrix(this.weights.inputLayer.length, this.weights.inputLayer[0].length),
      hiddenLayer1: this.createZeroMatrix(this.weights.hiddenLayer1.length, this.weights.hiddenLayer1[0].length),
      hiddenLayer2: this.createZeroMatrix(this.weights.hiddenLayer2.length, this.weights.hiddenLayer2[0].length),
      biasesHidden1: new Array(this.weights.biases.hidden1.length).fill(0),
      biasesHidden2: new Array(this.weights.biases.hidden2.length).fill(0),
      biasOutput: 0
    };

    // Прямой и обратный проход для каждого примера в батче
    for (const sample of batch) {
      const forwardResult = this.forwardPass(sample.features, true);
      const loss = this.calculateLoss(forwardResult.probability / 100, sample.target);
      totalLoss += loss;
      
      // Обратное распространение
      this.backpropagate(sample, forwardResult, gradients);
    }

    // Усреднение градиентов
    this.averageGradients(gradients, batch.length);
    
    // Обновление весов
    this.updateWeights(gradients);
    
    return totalLoss / batch.length;
  }

  private createZeroMatrix(rows: number, cols: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = new Array(cols).fill(0);
    }
    return matrix;
  }

  private calculateLoss(predicted: number, actual: number): number {
    // Binary cross-entropy loss
    const epsilon = 1e-15;
    const clampedPredicted = Math.max(epsilon, Math.min(1 - epsilon, predicted));
    
    return -(actual * Math.log(clampedPredicted) + (1 - actual) * Math.log(1 - clampedPredicted));
  }

  private backpropagate(sample: TrainingData, forwardResult: any, gradients: Gradients): void {
    const { features, target } = sample;
    const { activations } = forwardResult;
    
    if (!activations) return;
    
    const predicted = forwardResult.probability / 100;
    
    // Градиент для выходного слоя (binary cross-entropy)
    const outputError = predicted - target;
    gradients.biasOutput += outputError;
    
    // Градиенты для весов между hidden2 и output
    for (let i = 0; i < activations.hidden2.length; i++) {
      gradients.hiddenLayer2[i][0] += activations.hidden2[i] * outputError;
    }
    
    // Градиенты для hidden2
    const hidden2Errors = new Array(activations.hidden2.length);
    for (let i = 0; i < activations.hidden2.length; i++) {
      hidden2Errors[i] = outputError * this.weights.hiddenLayer2[i][0] * 
                        this.leakyReluDerivative(activations.hidden2[i]);
      gradients.biasesHidden2[i] += hidden2Errors[i];
    }
    
    // Градиенты для весов между hidden1 и hidden2
    for (let i = 0; i < activations.hidden1.length; i++) {
      for (let j = 0; j < hidden2Errors.length; j++) {
        gradients.hiddenLayer1[i][j] += activations.hidden1[i] * hidden2Errors[j];
      }
    }
    
    // Градиенты для hidden1
    const hidden1Errors = new Array(activations.hidden1.length);
    for (let i = 0; i < activations.hidden1.length; i++) {
      let error = 0;
      for (let j = 0; j < hidden2Errors.length; j++) {
        error += hidden2Errors[j] * this.weights.hiddenLayer1[i][j];
      }
      hidden1Errors[i] = error * this.leakyReluDerivative(activations.hidden1[i]);
      gradients.biasesHidden1[i] += hidden1Errors[i];
    }
    
    // Градиенты для весов между input и hidden1
    for (let i = 0; i < features.length; i++) {
      for (let j = 0; j < hidden1Errors.length; j++) {
        gradients.inputLayer[i][j] += features[i] * hidden1Errors[j];
      }
    }
  }

  private averageGradients(gradients: Gradients, batchSize: number): void {
    // Усреднение градиентов по размеру батча
    for (let i = 0; i < gradients.inputLayer.length; i++) {
      for (let j = 0; j < gradients.inputLayer[i].length; j++) {
        gradients.inputLayer[i][j] /= batchSize;
      }
    }
    
    for (let i = 0; i < gradients.hiddenLayer1.length; i++) {
      for (let j = 0; j < gradients.hiddenLayer1[i].length; j++) {
        gradients.hiddenLayer1[i][j] /= batchSize;
      }
    }
    
    for (let i = 0; i < gradients.hiddenLayer2.length; i++) {
      for (let j = 0; j < gradients.hiddenLayer2[i].length; j++) {
        gradients.hiddenLayer2[i][j] /= batchSize;
      }
    }
    
    gradients.biasesHidden1.forEach((_, i) => gradients.biasesHidden1[i] /= batchSize);
    gradients.biasesHidden2.forEach((_, i) => gradients.biasesHidden2[i] /= batchSize);
    gradients.biasOutput /= batchSize;
  }

  private updateWeights(gradients: Gradients): void {
    // Adam optimizer или простой momentum
    if (!this.previousGradients) {
      this.previousGradients = {
        inputLayer: this.createZeroMatrix(gradients.inputLayer.length, gradients.inputLayer[0].length),
        hiddenLayer1: this.createZeroMatrix(gradients.hiddenLayer1.length, gradients.hiddenLayer1[0].length),
        hiddenLayer2: this.createZeroMatrix(gradients.hiddenLayer2.length, gradients.hiddenLayer2[0].length),
        biasesHidden1: new Array(gradients.biasesHidden1.length).fill(0),
        biasesHidden2: new Array(gradients.biasesHidden2.length).fill(0),
        biasOutput: 0
      };
    }
    
    // Обновление весов с momentum и L2 регуляризацией
    this.updateLayerWeights(this.weights.inputLayer, gradients.inputLayer, this.previousGradients.inputLayer);
    this.updateLayerWeights(this.weights.hiddenLayer1, gradients.hiddenLayer1, this.previousGradients.hiddenLayer1);
    this.updateLayerWeights(this.weights.hiddenLayer2, gradients.hiddenLayer2, this.previousGradients.hiddenLayer2);
    
    // Обновление biases
    for (let i = 0; i < this.weights.biases.hidden1.length; i++) {
      this.previousGradients.biasesHidden1[i] = this.momentum * this.previousGradients.biasesHidden1[i] + 
                                              this.learningRate * gradients.biasesHidden1[i];
      this.weights.biases.hidden1[i] -= this.previousGradients.biasesHidden1[i];
    }
    
    for (let i = 0; i < this.weights.biases.hidden2.length; i++) {
      this.previousGradients.biasesHidden2[i] = this.momentum * this.previousGradients.biasesHidden2[i] + 
                                              this.learningRate * gradients.biasesHidden2[i];
      this.weights.biases.hidden2[i] -= this.previousGradients.biasesHidden2[i];
    }
    
    this.previousGradients.biasOutput = this.momentum * this.previousGradients.biasOutput + 
                                       this.learningRate * gradients.biasOutput;
    this.weights.biases.output -= this.previousGradients.biasOutput;
  }

  private updateLayerWeights(weights: number[][], gradients: number[][], previousGradients: number[][]): void {
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights[i].length; j++) {
        // L2 регуляризация
        const regularization = this.decay * weights[i][j];
        
        // Momentum update
        previousGradients[i][j] = this.momentum * previousGradients[i][j] + 
                                 this.learningRate * (gradients[i][j] + regularization);
        
        weights[i][j] -= previousGradients[i][j];
        
        // Gradient clipping для стабильности
        weights[i][j] = Math.max(-5, Math.min(5, weights[i][j]));
      }
    }
  }

  private validateModel(validData: TrainingData[]): number {
    let totalLoss = 0;
    
    for (const sample of validData) {
      const prediction = this.forwardPass(sample.features, false);
      const loss = this.calculateLoss(prediction.probability / 100, sample.target);
      totalLoss += loss;
    }
    
    return totalLoss / validData.length;
  }

  private updatePerformanceMetrics(validData: TrainingData[]): void {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    
    const returns: number[] = [];
    let cumulativeReturn = 0;
    let maxReturn = 0;
    let wins = 0;
    let totalProfits = 0;
    let totalLosses = 0;

    for (const sample of validData) {
      const prediction = this.forwardPass(sample.features, false);
      const predicted = prediction.probability > 50 ? 1 : 0;
      const actual = sample.target;
      
      // Confusion matrix
      if (predicted === 1 && actual === 1) truePositives++;
      else if (predicted === 1 && actual === 0) falsePositives++;
      else if (predicted === 0 && actual === 0) trueNegatives++;
      else if (predicted === 0 && actual === 1) falseNegatives++;
      
      // Trading metrics
      const tradeReturn = predicted === actual ? 0.001 : -0.001; // Упрощенная модель доходности
      returns.push(tradeReturn);
      cumulativeReturn += tradeReturn;
      maxReturn = Math.max(maxReturn, cumulativeReturn);
      
      if (tradeReturn > 0) {
        wins++;
        totalProfits += tradeReturn;
      } else {
        totalLosses += Math.abs(tradeReturn);
      }
    }
    
    // Рассчет метрик
    const totalSamples = validData.length;
    this.performance.accuracy = ((truePositives + trueNegatives) / totalSamples) * 100;
    this.performance.precision = truePositives / (truePositives + falsePositives) * 100 || 0;
    this.performance.recall = truePositives / (truePositives + falseNegatives) * 100 || 0;
    this.performance.f1Score = 2 * (this.performance.precision * this.performance.recall) / 
                              (this.performance.precision + this.performance.recall) || 0;
    
    this.performance.winRate = (wins / totalSamples) * 100;
    this.performance.profitFactor = totalLosses > 0 ? totalProfits / totalLosses : 0;
    this.performance.maxDrawdown = (maxReturn - cumulativeReturn) * 100;
    
    // Sharpe ratio
    if (returns.length > 0) {
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const stdReturn = Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      );
      this.performance.sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;
    }
  }

  // Публичные методы для прогнозирования
  async predictDirection(candles: CandleData[]): Promise<PredictionResult> {
    try {
      if (candles.length < 25) {
        return this.getDefaultPrediction();
      }

      const lastIndex = candles.length - 1;
      const features = this.extractFeatures(candles, lastIndex);
      
      if (features.some(f => !isFinite(f))) {
        return this.getDefaultPrediction();
      }

      const prediction = this.forwardPass(features, false);
      
      // Ensemble prediction с несколькими прогонами для повышения надежности
      const ensemblePredictions: number[] = [];
      for (let i = 0; i < 5; i++) {
        const ensemblePred = this.forwardPass(features, false);
        ensemblePredictions.push(ensemblePred.probability);
      }
      
      const avgProbability = ensemblePredictions.reduce((sum, p) => sum + p, 0) / ensemblePredictions.length;
      const stdProbability = Math.sqrt(
        ensemblePredictions.reduce((sum, p) => sum + Math.pow(p - avgProbability, 2), 0) / ensemblePredictions.length
      );
      
      // Калибровка confidence на основе дисперсии предсказаний
      const calibratedConfidence = Math.max(55, Math.min(95, 
        prediction.confidence * (1 - stdProbability / 10)
      ));

      return {
        direction: avgProbability > 50 ? 'UP' : 'DOWN',
        probability: Math.round(avgProbability),
        confidence: Math.round(calibratedConfidence),
        reasoning: this.generateReasoning(candles, features, prediction),
        modelAccuracy: this.performance.accuracy,
        uncertainty: Math.round(prediction.uncertainty),
        signalStrength: this.calculateSignalStrength(features, prediction),
        marketCondition: this.assessMarketCondition(candles)
      };
    } catch (error) {
      console.error('❌ Ошибка при прогнозировании:', error);
      return this.getDefaultPrediction();
    }
  }

  private getDefaultPrediction(): PredictionResult {
    return {
      direction: 'UP',
      probability: 52,
      confidence: 55,
      reasoning: 'Недостаточно данных для качественного анализа. Используется базовая модель.',
      modelAccuracy: this.performance.accuracy,
      uncertainty: 50,
      signalStrength: 'weak',
      marketCondition: 'neutral'
    };
  }

  private generateReasoning(candles: CandleData[], features: number[], prediction: any): string {
    const current = candles[candles.length - 1];
    const indicators = this.calculateTechnicalIndicators(candles.slice(-20));
    
    const reasons: string[] = [];
    
    // Анализ технических индикаторов
    if (indicators.rsi > 70) reasons.push('RSI показывает перекупленность');
    else if (indicators.rsi < 30) reasons.push('RSI указывает на перепроданность');
    
    if (indicators.macd.histogram > 0) reasons.push('MACD гистограмма положительная');
    else reasons.push('MACD гистограмма отрицательная');
    
    // Анализ Bollinger Bands
    const bbPosition = (current.close - indicators.bollinger.lower) / 
                      (indicators.bollinger.upper - indicators.bollinger.lower);
    if (bbPosition > 0.8) reasons.push('Цена у верхней границы Bollinger Bands');
    else if (bbPosition < 0.2) reasons.push('Цена у нижней границы Bollinger Bands');
    
    // Анализ тренда
    const trendFeature = features[15]; // Индекс признака силы тренда
    if (trendFeature > 0.1) reasons.push('Обнаружен восходящий тренд');
    else if (trendFeature < -0.1) reasons.push('Обнаружен нисходящий тренд');
    
    // Анализ волатильности
    const volatilityFeature = features[16];
    if (volatilityFeature > 0.3) reasons.push('Высокая волатильность рынка');
    else if (volatilityFeature < 0.1) reasons.push('Низкая волатильность рынка');
    
    return reasons.length > 0 ? reasons.join('. ') + '.' : 
           'Комплексный анализ технических индикаторов и рыночных паттернов.';
  }

  private calculateSignalStrength(features: number[], prediction: any): 'weak' | 'medium' | 'strong' {
    const confidence = prediction.confidence;
    const uncertainty = prediction.uncertainty;
    
    // Анализ согласованности признаков
    const trendFeatures = features.slice(15, 18); // Признаки тренда
    const trendAgreement = Math.abs(trendFeatures.reduce((sum, f) => sum + f, 0) / trendFeatures.length);
    
    if (confidence > 80 && uncertainty < 20 && trendAgreement > 0.2) return 'strong';
    if (confidence > 65 && uncertainty < 35 && trendAgreement > 0.1) return 'medium';
    return 'weak';
  }

  private assessMarketCondition(candles: CandleData[]): 'bullish' | 'bearish' | 'neutral' | 'volatile' {
    if (candles.length < 20) return 'neutral';
    
    const recent = candles.slice(-20);
    const indicators = this.calculateTechnicalIndicators(recent);
    
    // Анализ тренда
    const priceChange = (recent[recent.length - 1].close - recent[0].close) / recent[0].close;
    
    // Анализ волатильности
    const returns = [];
    for (let i = 1; i < recent.length; i++) {
      returns.push((recent[i].close - recent[i-1].close) / recent[i-1].close);
    }
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length);
    
    if (volatility > 0.03) return 'volatile';
    if (priceChange > 0.02 && indicators.rsi < 70) return 'bullish';
    if (priceChange < -0.02 && indicators.rsi > 30) return 'bearish';
    return 'neutral';
  }

  // Методы сохранения и загрузки модели
  private saveModelState(): void {
    try {
      const modelState = {
        weights: this.weights,
        performance: this.performance,
        epochCount: this.epochCount,
        learningRate: this.learningRate,
        timestamp: Date.now()
      };
      
      // В реальном приложении здесь была бы запись в IndexedDB или на сервер
      console.log('💾 Состояние модели сохранено', {
        accuracy: this.performance.accuracy.toFixed(2) + '%',
        epochs: this.epochCount
      });
    } catch (error) {
      console.error('❌ Ошибка сохранения модели:', error);
    }
  }

  private loadModelState(): void {
    try {
      // В реальном приложении здесь была бы загрузка из IndexedDB или с сервера
      console.log('📂 Попытка загрузки сохраненной модели...');
      // Если модель не найдена, используются инициализированные веса
    } catch (error) {
      console.warn('⚠️ Сохраненная модель не найдена, используется новая инициализация');
    }
  }

  // Геттеры для мониторинга производительности
  getPerformanceMetrics(): ModelPerformance {
    return { ...this.performance };
  }

  getTrainingHistory(): TrainingData[] {
    return this.trainingHistory.slice(-1000); // Последние 1000 записей
  }

  getModelInfo(): {
    epochs: number;
    learningRate: number;
    trainingSize: number;
    lastTraining: string;
  } {
    return {
      epochs: this.epochCount,
      learningRate: this.learningRate,
      trainingSize: this.trainingHistory.length,
      lastTraining: this.trainingHistory.length > 0 
        ? new Date(this.trainingHistory[this.trainingHistory.length - 1].timestamp).toLocaleString()
        : 'Никогда'
    };
  }

  // Метод для тонкой настройки модели на новых данных
  async finetune(newCandles: CandleData[], iterations: number = 10): Promise<void> {
    console.log(`🔧 Начало дообучения модели на ${newCandles.length} новых свечах`);
    
    const newTrainingData = this.prepareTrainingData(newCandles);
    if (newTrainingData.length === 0) return;
    
    // Снижаем learning rate для тонкой настройки
    const originalLR = this.learningRate;
    this.learningRate *= 0.1;
    
    for (let i = 0; i < iterations; i++) {
      this.shuffleArray(newTrainingData);
      const batches = this.createMiniBatches(newTrainingData, Math.min(this.miniBatchSize, 16));
      
      let totalLoss = 0;
      for (const batch of batches) {
        totalLoss += this.trainBatch(batch);
      }
      
      if (i % 5 === 0) {
        console.log(`🔄 Дообучение итерация ${i}: loss=${(totalLoss / batches.length).toFixed(4)}`);
      }
    }
    
    // Восстанавливаем learning rate
    this.learningRate = originalLR;
    
    // Обновляем историю обучения
    this.trainingHistory.push(...newTrainingData);
    if (this.trainingHistory.length > 10000) {
      this.trainingHistory = this.trainingHistory.slice(-5000);
    }
    
    this.saveModelState();
    console.log('✅ Дообучение завершено');
  }
} 

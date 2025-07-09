
export interface ManualDataInputs {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
  time: string;
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
    pattern: number;
    trend: number;
  };
  recommendation: string;
}

export interface ModelStatistics {
  totalPredictions: number;
  accurateCount: number;
  overallAccuracy: number;
  callAccuracy: number;
  putAccuracy: number;
  currentWeights: {
    technical: number;
    volume: number;
    momentum: number;
    volatility: number;
    pattern: number;
    trend: number;
  };
}

export interface TechnicalIndicators {
  rsi: number;
  macd: { line: number; signal: number; histogram: number };
  bollingerBands: { upper: number; middle: number; lower: number };
  ema: { ema12: number; ema26: number };
  stochastic: { k: number; d: number };
  atr: number;
  adx: number;
}

export interface PatternSignal {
  name: string;
  strength: number;
  isReversal: boolean;
  isContinuation: boolean;
}

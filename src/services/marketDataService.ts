import { CandleData } from '@/types/session';

interface MarketDataConfig {
  symbol: string;
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  limit?: number;
  apiKey?: string;
}

interface RealTimeData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  date: Date;
  impact: 'low' | 'medium' | 'high';
  actual?: number;
  forecast?: number;
  previous?: number;
}

export class MarketDataService {
  private static instance: MarketDataService;
  private websockets: Map<string, WebSocket> = new Map();
  private dataCache: Map<string, CandleData[]> = new Map();
  private subscribers: Map<string, Array<(data: any) => void>> = new Map();
  private readonly baseUrls = {
    binance: 'https://api.binance.com/api/v3',
    alphaVantage: 'https://www.alphavantage.co/query',
    yahoo: 'https://query1.finance.yahoo.com/v8/finance/chart',
    economicCalendar: 'https://api.forexfactory.com/calendar'
  };

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  // Подключение к real-time данным
  async connectRealTime(config: MarketDataConfig): Promise<void> {
    const { symbol, interval } = config;
    const wsKey = `${symbol}_${interval}`;
    
    try {
      // Binance WebSocket для crypto
      if (this.isCryptoSymbol(symbol)) {
        await this.connectBinanceWS(symbol, interval, wsKey);
      }
      // Alpha Vantage для форекса и акций
      else {
        await this.connectAlphaVantageWS(symbol, interval, wsKey);
      }
      
      console.log(`Connected to real-time data for ${symbol} ${interval}`);
    } catch (error) {
      console.error('Error connecting to real-time data:', error);
      throw error;
    }
  }

  // Подключение к Binance WebSocket
  private async connectBinanceWS(symbol: string, interval: string, wsKey: string): Promise<void> {
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`Binance WebSocket connected for ${symbol}`);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const kline = data.k;
        
        const candleData: CandleData = {
          id: `${symbol}_${kline.t}`,
          session_id: 'realtime',
          candle_index: Math.floor(Date.now() / 1000),
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
          candle_datetime: new Date(kline.t).toISOString(),
          timestamp: new Date(kline.t).toISOString(),
          created_at: new Date().toISOString()
        };
        
        this.updateCandleCache(wsKey, candleData);
        this.notifySubscribers(wsKey, candleData);
        
      } catch (error) {
        console.error('Error parsing Binance data:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Binance WebSocket error:', error);
      this.reconnectWebSocket(wsKey, () => this.connectBinanceWS(symbol, interval, wsKey));
    };
    
    ws.onclose = () => {
      console.log('Binance WebSocket closed');
      this.reconnectWebSocket(wsKey, () => this.connectBinanceWS(symbol, interval, wsKey));
    };
    
    this.websockets.set(wsKey, ws);
  }

  // Загрузка исторических данных
  async getHistoricalData(config: MarketDataConfig): Promise<CandleData[]> {
    const { symbol, interval, limit = 1000 } = config;
    const cacheKey = `${symbol}_${interval}_${limit}`;
    
    // Проверяем кэш
    if (this.dataCache.has(cacheKey)) {
      const cached = this.dataCache.get(cacheKey)!;
      const lastUpdate = new Date(cached[cached.length - 1]?.created_at || 0);
      const now = new Date();
      
      // Если данные свежие (менее 5 минут), возвращаем из кэша
      if (now.getTime() - lastUpdate.getTime() < 5 * 60 * 1000) {
        return cached;
      }
    }
    
    try {
      let historicalData: CandleData[];
      
      if (this.isCryptoSymbol(symbol)) {
        historicalData = await this.getBinanceHistorical(symbol, interval, limit);
      } else if (this.isForexSymbol(symbol)) {
        historicalData = await this.getAlphaVantageHistorical(symbol, interval, limit);
      } else {
        historicalData = await this.getYahooHistorical(symbol, interval, limit);
      }
      
      // Кэшируем данные
      this.dataCache.set(cacheKey, historicalData);
      
      return historicalData;
      
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return this.dataCache.get(cacheKey) || [];
    }
  }

  // Получение данных с Binance
  private async getBinanceHistorical(symbol: string, interval: string, limit: number): Promise<CandleData[]> {
    const url = `${this.baseUrls.binance}/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.map((kline: any[], index: number) => ({
      id: `${symbol}_${kline[0]}`,
      session_id: 'historical',
      candle_index: index,
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
      candle_datetime: new Date(kline[0]).toISOString(),
      timestamp: new Date(kline[0]).toISOString(),
      created_at: new Date().toISOString()
    }));
  }

  // Получение экономических событий
  async getEconomicCalendar(date?: Date): Promise<EconomicEvent[]> {
    try {
      // Заглушка для экономического календаря
      // В реальной реализации здесь будет запрос к API календаря
      return [
        {
          id: '1',
          title: 'Non-Farm Payrolls',
          country: 'US',
          date: new Date(),
          impact: 'high',
          forecast: 200000,
          previous: 180000
        },
        {
          id: '2',
          title: 'GDP Growth Rate',
          country: 'EU',
          date: new Date(),
          impact: 'medium',
          forecast: 2.1,
          previous: 1.9
        }
      ];
    } catch (error) {
      console.error('Error fetching economic calendar:', error);
      return [];
    }
  }

  // Подписка на обновления данных
  subscribe(symbol: string, interval: string, callback: (data: CandleData) => void): string {
    const wsKey = `${symbol}_${interval}`;
    
    if (!this.subscribers.has(wsKey)) {
      this.subscribers.set(wsKey, []);
    }
    
    this.subscribers.get(wsKey)!.push(callback);
    
    // Возвращаем ID подписки для отписки
    return `${wsKey}_${this.subscribers.get(wsKey)!.length - 1}`;
  }

  // Отписка от обновлений
  unsubscribe(subscriptionId: string): void {
    const [wsKey, indexStr] = subscriptionId.split('_');
    const index = parseInt(indexStr);
    
    const subscribers = this.subscribers.get(wsKey);
    if (subscribers && subscribers[index]) {
      subscribers.splice(index, 1);
    }
  }

  // Получение текущих рыночных данных
  async getCurrentMarketData(symbols: string[]): Promise<RealTimeData[]> {
    try {
      const promises = symbols.map(async (symbol) => {
        if (this.isCryptoSymbol(symbol)) {
          return this.getBinanceCurrentData(symbol);
        } else {
          return this.getAlphaVantageCurrentData(symbol);
        }
      });
      
      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<RealTimeData> => 
          result.status === 'fulfilled')
        .map(result => result.value);
        
    } catch (error) {
      console.error('Error fetching current market data:', error);
      return [];
    }
  }

  // Вспомогательные методы
  private isCryptoSymbol(symbol: string): boolean {
    return symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH');
  }

  private isForexSymbol(symbol: string): boolean {
    return symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP');
  }

  private updateCandleCache(wsKey: string, candle: CandleData): void {
    if (!this.dataCache.has(wsKey)) {
      this.dataCache.set(wsKey, []);
    }
    
    const cache = this.dataCache.get(wsKey)!;
    cache.push(candle);
    
    // Ограничиваем размер кэша
    if (cache.length > 5000) {
      cache.splice(0, 1000); // Удаляем старые данные
    }
  }

  private notifySubscribers(wsKey: string, data: CandleData): void {
    const subscribers = this.subscribers.get(wsKey);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  private reconnectWebSocket(wsKey: string, connectFn: () => Promise<void>): void {
    setTimeout(async () => {
      try {
        await connectFn();
        console.log(`Reconnected WebSocket for ${wsKey}`);
      } catch (error) {
        console.error(`Failed to reconnect WebSocket for ${wsKey}:`, error);
        this.reconnectWebSocket(wsKey, connectFn);
      }
    }, 5000); // Переподключение через 5 секунд
  }

  // Заглушки для других методов
  private async connectAlphaVantageWS(symbol: string, interval: string, wsKey: string): Promise<void> {
    // Реализация для Alpha Vantage WebSocket
    console.log(`Connecting to Alpha Vantage WS for ${symbol}`);
  }

  private async getAlphaVantageHistorical(symbol: string, interval: string, limit: number): Promise<CandleData[]> {
    // Реализация для Alpha Vantage API
    return [];
  }

  private async getYahooHistorical(symbol: string, interval: string, limit: number): Promise<CandleData[]> {
    // Реализация для Yahoo Finance API
    return [];
  }

  private async getBinanceCurrentData(symbol: string): Promise<RealTimeData> {
    const url = `${this.baseUrls.binance}/ticker/24hr?symbol=${symbol.toUpperCase()}`;
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      symbol,
      price: parseFloat(data.lastPrice),
      volume: parseFloat(data.volume),
      timestamp: Date.now(),
      change24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice)
    };
  }

  private async getAlphaVantageCurrentData(symbol: string): Promise<RealTimeData> {
    // Реализация для Alpha Vantage
    return {
      symbol,
      price: 0,
      volume: 0,
      timestamp: Date.now(),
      change24h: 0,
      high24h: 0,
      low24h: 0
    };
  }

  // Очистка ресурсов
  disconnect(): void {
    this.websockets.forEach((ws, key) => {
      ws.close();
      console.log(`Disconnected WebSocket for ${key}`);
    });
    
    this.websockets.clear();
    this.subscribers.clear();
    this.dataCache.clear();
  }
}
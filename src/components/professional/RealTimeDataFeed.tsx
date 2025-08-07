import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wifi, WifiOff, Activity, AlertCircle, Play, Pause, Settings } from 'lucide-react';
import { marketDataService } from '@/services/marketDataService';
import { MarketData, StreamConfig } from '@/types/trading';

interface RealTimeDataFeedProps {
  pair: string;
  timeframe: string;
  onDataUpdate?: (data: MarketData) => void;
  onConnectionChange?: (connected: boolean) => void;
}

const RealTimeDataFeed = ({ 
  pair, 
  timeframe, 
  onDataUpdate, 
  onConnectionChange 
}: RealTimeDataFeedProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentData, setCurrentData] = useState<MarketData | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    enableRealTime: true,
    updateInterval: 1000,
    maxHistoryLength: 100,
    enableVolume: true,
    enableOrderBook: false
  });

  // Инициализация подключения
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        console.log('🔌 Initializing market data connection...');
        await marketDataService.initialize();
        
        const isAvailable = await marketDataService.checkConnection();
        setIsConnected(isAvailable);
        onConnectionChange?.(isAvailable);
        
        if (!isAvailable) {
          setConnectionError('Market data service is not available. Using simulated data.');
        }
        
        console.log(`📊 Market data connection: ${isAvailable ? 'Connected' : 'Simulated'}`);
      } catch (error) {
        console.error('❌ Error initializing market data:', error);
        setConnectionError('Failed to connect to market data service');
        setIsConnected(false);
        onConnectionChange?.(false);
      }
    };

    initializeConnection();

    return () => {
      stopStreaming();
      marketDataService.disconnect();
    };
  }, []);

  // Автоматический рестарт стрима при изменении параметров
  useEffect(() => {
    if (isStreaming) {
      stopStreaming();
      setTimeout(() => startStreaming(), 500);
    }
  }, [pair, timeframe]);

  const startStreaming = useCallback(async () => {
    try {
      console.log(`▶️ Starting data stream for ${pair} ${timeframe}`);
      
      // Настраиваем callback для обновлений данных
      const onDataCallback = (data: MarketData) => {
        setCurrentData(data);
        onDataUpdate?.(data);
        
        // Обновляем историю цен для графика
        setPriceHistory(prev => {
          const newHistory = [...prev, {
            time: new Date(data.timestamp).toLocaleTimeString(),
            price: data.price,
            volume: data.volume
          }];
          
          // Ограничиваем историю
          return newHistory.slice(-streamConfig.maxHistoryLength);
        });
      };

      // Запускаем стрим
      await marketDataService.startRealTimeStream(pair, timeframe, onDataCallback);
      setIsStreaming(true);
      setConnectionError(null);
      
      console.log('✅ Data stream started successfully');
    } catch (error) {
      console.error('❌ Error starting data stream:', error);
      setConnectionError('Failed to start data stream');
      setIsStreaming(false);
    }
  }, [pair, timeframe, streamConfig.maxHistoryLength, onDataUpdate]);

  const stopStreaming = useCallback(() => {
    console.log('⏹️ Stopping data stream');
    marketDataService.stopRealTimeStream();
    setIsStreaming(false);
  }, []);

  const toggleStreaming = useCallback(() => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  }, [isStreaming, startStreaming, stopStreaming]);

  const formatPrice = (price: number) => {
    if (pair.includes('JPY')) return price.toFixed(3);
    if (pair.includes('BTC') || pair.includes('ETH')) return price.toFixed(2);
    return price.toFixed(5);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Connection Status and Controls */}
      <Card className="p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <Wifi className="h-6 w-6 text-green-400" />
            ) : (
              <WifiOff className="h-6 w-6 text-red-400" />
            )}
            <h3 className="text-xl font-semibold text-white">Real-Time Market Data</h3>
            <Badge className={isConnected ? 'bg-green-600' : 'bg-red-600'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-sm">Stream</span>
              <Switch
                checked={isStreaming}
                onCheckedChange={toggleStreaming}
                disabled={!isConnected}
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleStreaming}
              disabled={!isConnected}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600"
            >
              {isStreaming ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Connection Error Alert */}
        {connectionError && (
          <Alert className="mb-6 border-yellow-600 bg-yellow-600/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-200">
              {connectionError}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Market Data */}
        {currentData && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">
                {formatPrice(currentData.price)}
              </div>
              <p className="text-slate-400 text-sm">Current Price</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className={`text-2xl font-bold mb-1 ${getPriceChangeColor(currentData.change)}`}>
                {currentData.change > 0 ? '+' : ''}{formatPrice(currentData.change)}
              </div>
              <p className="text-slate-400 text-sm">Change</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className={`text-2xl font-bold mb-1 ${getPriceChangeColor(currentData.changePercent)}`}>
                {currentData.changePercent > 0 ? '+' : ''}{currentData.changePercent.toFixed(2)}%
              </div>
              <p className="text-slate-400 text-sm">Change %</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {formatVolume(currentData.volume)}
              </div>
              <p className="text-slate-400 text-sm">Volume</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {(currentData.volatility * 100).toFixed(2)}%
              </div>
              <p className="text-slate-400 text-sm">Volatility</p>
            </div>
          </div>
        )}

        {/* Stream Status */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Activity className={`h-4 w-4 ${isStreaming ? 'text-green-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-slate-400">
                Status: {isStreaming ? 'Streaming' : 'Stopped'}
              </span>
            </div>
            <div className="text-slate-400">
              Pair: {pair} | Timeframe: {timeframe}
            </div>
          </div>
          
          {currentData && (
            <div className="text-slate-400">
              Last Update: {new Date(currentData.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </Card>

      {/* Real-Time Price Chart */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Live Price Movement</h3>
        
        {priceHistory.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  domain={['dataMin - 0.001', 'dataMax + 0.001']}
                  tickFormatter={formatPrice}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value: any, name: string) => [
                    name === 'price' ? formatPrice(value) : formatVolume(value),
                    name === 'price' ? 'Price' : 'Volume'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  dot={false}
                  name="price"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Activity className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">
                {isStreaming ? 'Waiting for price data...' : 'Start streaming to see live price movement'}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Stream Configuration */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="h-5 w-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-white">Stream Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Enable Real-Time Updates</span>
              <Switch
                checked={streamConfig.enableRealTime}
                onCheckedChange={(checked) => 
                  setStreamConfig(prev => ({ ...prev, enableRealTime: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Include Volume Data</span>
              <Switch
                checked={streamConfig.enableVolume}
                onCheckedChange={(checked) => 
                  setStreamConfig(prev => ({ ...prev, enableVolume: checked }))
                }
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm">Update Interval (ms)</label>
              <select 
                value={streamConfig.updateInterval}
                onChange={(e) => setStreamConfig(prev => ({ 
                  ...prev, 
                  updateInterval: Number(e.target.value) 
                }))}
                className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value={1000}>1 second</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
              </select>
            </div>
            
            <div>
              <label className="text-slate-300 text-sm">History Length</label>
              <select 
                value={streamConfig.maxHistoryLength}
                onChange={(e) => setStreamConfig(prev => ({ 
                  ...prev, 
                  maxHistoryLength: Number(e.target.value) 
                }))}
                className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value={50}>50 points</option>
                <option value={100}>100 points</option>
                <option value={200}>200 points</option>
                <option value={500}>500 points</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RealTimeDataFeed;
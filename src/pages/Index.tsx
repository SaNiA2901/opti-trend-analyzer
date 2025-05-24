
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PriceChart from "@/components/PriceChart";
import TechnicalIndicators from "@/components/TechnicalIndicators";
import TradingSignals from "@/components/TradingSignals";
import MarketOverview from "@/components/MarketOverview";
import MLPredictions from "@/components/MLPredictions";
import RiskManagement from "@/components/RiskManagement";
import AutoTradingStrategies from "@/components/AutoTradingStrategies";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import WeightedPriceForecast from "@/components/WeightedPriceForecast";
import { TrendingUp, TrendingDown, BarChart } from "lucide-react";

const Index = () => {
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [timeframe, setTimeframe] = useState("1h");

  const currencyPairs = [
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", 
    "AUD/USD", "USD/CAD", "NZD/USD", "EUR/GBP", "BTC/USD"
  ];

  const timeframes = [
    { value: "1m", label: "1 минута" },
    { value: "5m", label: "5 минут" },
    { value: "15m", label: "15 минут" },
    { value: "30m", label: "30 минут" },
    { value: "1h", label: "1 час" },
    { value: "4h", label: "4 часа" },
    { value: "1d", label: "1 день" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BarChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">OptiTrend Analyzer</h1>
                <p className="text-slate-400 text-sm">Профессиональный анализ валютного рынка и криптовалют</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {currencyPairs.map(pair => (
                    <SelectItem key={pair} value={pair} className="text-white focus:bg-slate-700">
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {timeframes.map(tf => (
                    <SelectItem key={tf.value} value={tf.value} className="text-white focus:bg-slate-700">
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Market Overview */}
          <div className="lg:col-span-1">
            <MarketOverview selectedPair={selectedPair} />
          </div>

          {/* Main Chart and Analysis */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="chart" className="space-y-6">
              <TabsList className="bg-slate-800 border-slate-600">
                <TabsTrigger value="chart" className="data-[state=active]:bg-blue-600">
                  График цены
                </TabsTrigger>
                <TabsTrigger value="forecast" className="data-[state=active]:bg-blue-600">
                  Прогноз цены
                </TabsTrigger>
                <TabsTrigger value="indicators" className="data-[state=active]:bg-blue-600">
                  Технические индикаторы
                </TabsTrigger>
                <TabsTrigger value="signals" className="data-[state=active]:bg-blue-600">
                  Торговые сигналы
                </TabsTrigger>
                <TabsTrigger value="ml" className="data-[state=active]:bg-blue-600">
                  AI Прогнозы
                </TabsTrigger>
                <TabsTrigger value="risk" className="data-[state=active]:bg-blue-600">
                  Риск-менеджмент
                </TabsTrigger>
                <TabsTrigger value="auto" className="data-[state=active]:bg-blue-600">
                  Автоторговля
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">
                  Аналитика
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chart">
                <PriceChart pair={selectedPair} timeframe={timeframe} />
              </TabsContent>

              <TabsContent value="forecast">
                <WeightedPriceForecast pair={selectedPair} timeframe={timeframe} />
              </TabsContent>

              <TabsContent value="indicators">
                <TechnicalIndicators pair={selectedPair} timeframe={timeframe} />
              </TabsContent>

              <TabsContent value="signals">
                <TradingSignals pair={selectedPair} timeframe={timeframe} />
              </TabsContent>

              <TabsContent value="ml">
                <MLPredictions pair={selectedPair} timeframe={timeframe} />
              </TabsContent>

              <TabsContent value="risk">
                <RiskManagement pair={selectedPair} />
              </TabsContent>

              <TabsContent value="auto">
                <AutoTradingStrategies pair={selectedPair} timeframe={timeframe} />
              </TabsContent>

              <TabsContent value="analytics">
                <AdvancedAnalytics pair={selectedPair} timeframe={timeframe} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

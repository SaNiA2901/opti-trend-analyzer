
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Database, AlertCircle } from "lucide-react";

interface PriceChartProps {
  pair: string;
  timeframe: string;
}

const PriceChart = ({ pair, timeframe }: PriceChartProps) => {
  return (
    <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-semibold text-white">{pair}</h3>
            <Badge className="bg-orange-600 text-white">Ручной режим</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">
              Данные отображаются после ввода в разделе "Бинарные опционы"
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-slate-400 text-sm">Временной интервал</p>
          <p className="text-white font-medium">{timeframe}</p>
        </div>
      </div>

      <div className="h-96 flex items-center justify-center bg-slate-700/30 rounded-lg">
        <div className="text-center space-y-4">
          <Database className="h-16 w-16 text-slate-500 mx-auto" />
          <div>
            <h4 className="text-white font-medium mb-2">Нет данных для отображения</h4>
            <p className="text-slate-400 text-sm max-w-md">
              Перейдите в раздел "Бинарные опционы" и введите данные OHLC для просмотра графика
            </p>
          </div>
          <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-3 max-w-sm mx-auto">
            <div className="flex items-center space-x-2 mb-1">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <span className="text-blue-200 text-sm font-medium">Информация</span>
            </div>
            <p className="text-blue-200 text-xs">
              График будет обновляться на основе ваших введенных данных
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
        <div className="text-center">
          <p className="text-slate-400 text-sm">Максимум</p>
          <p className="text-slate-500">--</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-sm">Минимум</p>
          <p className="text-slate-500">--</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-sm">Объем</p>
          <p className="text-slate-500">--</p>
        </div>
      </div>
    </Card>
  );
};

export default PriceChart;

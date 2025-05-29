
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface PredictionGeneratorProps {
  isGenerating: boolean;
}

const PredictionGenerator = ({ isGenerating }: PredictionGeneratorProps) => {
  if (!isGenerating) return null;

  return (
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
  );
};

export default PredictionGenerator;

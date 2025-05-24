
import { Card } from "@/components/ui/card";

const TradingTips = () => {
  const tips = [
    "Используйте несколько индикаторов для подтверждения сигналов",
    "Учитывайте новости и экономические события",
    "Не рискуйте более 2-5% от депозита на одну сделку",
    "Сигналы с вероятностью выше 75% имеют больший потенциал"
  ];

  return (
    <Card className="p-6 bg-slate-800/50 border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Рекомендации по торговле</h3>
      
      <div className="space-y-3">
        {tips.map((tip, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm">{tip}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TradingTips;

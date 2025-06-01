
export const parseTimeframe = (timeframe: string): number => {
  const timeframeMap: Record<string, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440
  };
  
  const minutes = timeframeMap[timeframe];
  if (minutes === undefined) {
    throw new Error(`Неподдерживаемый таймфрейм: ${timeframe}`);
  }
  
  return minutes;
};

export const formatCandleDateTime = (dateTime: string): string => {
  if (!dateTime) {
    return 'Неизвестно';
  }
  
  try {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) {
      throw new Error('Невалидная дата');
    }
    
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateTime;
  }
};

export const calculateCandleDateTime = (
  startDate: string,
  startTime: string,
  timeframe: string,
  candleIndex: number
): string => {
  if (!startDate || !startTime || !timeframe) {
    throw new Error('Отсутствуют обязательные параметры для расчета времени свечи');
  }
  
  if (typeof candleIndex !== 'number' || candleIndex < 0) {
    throw new Error('Индекс свечи должен быть неотрицательным числом');
  }
  
  try {
    const startDateTime = new Date(`${startDate}T${startTime}`);
    if (isNaN(startDateTime.getTime())) {
      throw new Error('Невалидная дата или время начала');
    }
    
    const minutes = parseTimeframe(timeframe) * candleIndex;
    const candleDateTime = new Date(startDateTime.getTime() + minutes * 60000);
    
    return candleDateTime.toISOString();
  } catch (error) {
    console.error('Error calculating candle time:', error);
    throw new Error(`Ошибка расчета времени свечи: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
};

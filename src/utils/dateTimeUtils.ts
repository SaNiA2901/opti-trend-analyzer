
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
  
  return timeframeMap[timeframe] || 1;
};

export const formatCandleDateTime = (dateTime: string): string => {
  try {
    const date = new Date(dateTime);
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
  try {
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const minutes = parseTimeframe(timeframe) * candleIndex;
    const candleDateTime = new Date(startDateTime.getTime() + minutes * 60000);
    return candleDateTime.toISOString();
  } catch (error) {
    console.error('Error calculating candle time:', error);
    throw new Error('Ошибка расчета времени свечи');
  }
};

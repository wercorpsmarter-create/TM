import React from 'react';
import { CloudSun, Cloud, Sun, CloudRain, CloudLightning, CloudDrizzle } from 'lucide-react';

export const WEATHER_CODES = {
    0: { label: 'Clear Sky', icon: <Sun size={32} className="text-yellow-400" /> },
    1: { label: 'Mainly Clear', icon: <Sun size={32} className="text-yellow-400" /> },
    2: { label: 'Partly Cloudy', icon: <CloudSun size={32} /> },
    3: { label: 'Overcast', icon: <Cloud size={32} /> },
    45: { label: 'Foggy', icon: <Cloud size={32} /> },
    48: { label: 'Rime Fog', icon: <Cloud size={32} /> },
    51: { label: 'Light Drizzle', icon: <CloudDrizzle size={32} /> },
    53: { label: 'Moderate Drizzle', icon: <CloudDrizzle size={32} /> },
    55: { label: 'Heavy Drizzle', icon: <CloudDrizzle size={32} /> },
    61: { label: 'Light Rain', icon: <CloudRain size={32} /> },
    63: { label: 'Moderate Rain', icon: <CloudRain size={32} /> },
    65: { label: 'Heavy Rain', icon: <CloudRain size={32} /> },
    71: { label: 'Light Snow', icon: <Cloud size={32} /> },
    73: { label: 'Moderate Snow', icon: <Cloud size={32} /> },
    75: { label: 'Heavy Snow', icon: <Cloud size={32} /> },
    80: { label: 'Light Showers', icon: <CloudRain size={32} /> },
    81: { label: 'Moderate Showers', icon: <CloudRain size={32} /> },
    82: { label: 'Heavy Showers', icon: <CloudRain size={32} /> },
    95: { label: 'Thunderstorms', icon: <CloudLightning size={32} /> },
};

// Helper function to get weather code for a specific date (YYYY-MM-DD string)
export const getWeatherForDate = (globalWeatherData, dateStr) => {
    if (!globalWeatherData || !globalWeatherData.time || !dateStr) return null;
    const index = globalWeatherData.time.findIndex(t => t === dateStr);
    if (index === -1) return null;
    return globalWeatherData.weathercode[index];
};

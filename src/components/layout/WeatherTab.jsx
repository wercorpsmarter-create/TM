import React, { useState, useEffect } from 'react';
import { Search, MapPin, CloudSun, Cloud, Sun, CloudRain, CloudLightning, CloudDrizzle, Wind, Thermometer, Droplets, MapPinIcon, RefreshCw, AlertCircle, Star, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WEATHER_CODES } from '../../utils/weatherIcons';

export default function WeatherTab({ weatherSettings, setWeatherSettings, setGlobalWeatherData }) {
    const [location, setLocation] = useState(() => localStorage.getItem('weather_location') || '');
    const [savedCoords, setSavedCoords] = useState(() => {
        const saved = localStorage.getItem('weather_coords');
        return saved ? JSON.parse(saved) : null;
    });
    const [weatherData, setWeatherData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    const fetchWeather = async (lat, lon, name) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
            const data = await res.json();

            if (data.daily) {
                setWeatherData({
                    ...data.daily,
                    locationName: name,
                    latitude: lat,
                    longitude: lon,
                    currentTemp: Math.round((data.daily.temperature_2m_max[0] + data.daily.temperature_2m_min[0]) / 2)
                });

                // Check if this is the default location
                const saved = localStorage.getItem('weather_coords');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const isSameLat = Math.abs(parsed.lat - lat) < 0.05;
                    const isSameLon = Math.abs(parsed.lon - lon) < 0.05;
                    setIsDefault(isSameLat && isSameLon);
                } else {
                    setIsDefault(false);
                }
            } else {
                setError("Could not load weather data.");
            }
        } catch (err) {
            setError("Weather service unavailable.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetDefault = () => {
        if (!weatherData) return;
        const coords = {
            lat: weatherData.latitude,
            lon: weatherData.longitude,
            name: weatherData.locationName
        };
        localStorage.setItem('weather_coords', JSON.stringify(coords));
        setSavedCoords(coords);
        setIsDefault(true);
        // Provide immediate global weather availability to avoid needing to refresh
        if (setGlobalWeatherData) {
            setGlobalWeatherData(weatherData);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();

            if (geoData.results && geoData.results[0]) {
                const { latitude, longitude, name, country } = geoData.results[0];
                const displayName = `${name}, ${country}`;
                fetchWeather(latitude, longitude, displayName);
                setSearchQuery('');
            } else {
                setError("Location not found. Try a city name.");
            }
        } catch (err) {
            setError("Geocoding service unavailable.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (savedCoords) {
            fetchWeather(savedCoords.lat, savedCoords.lon, savedCoords.name);
        }
    }, []);

    const getDayName = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    return (
        <div style={{ height: '100%', display: 'flex', gap: '2rem', color: 'var(--text-main)' }}>
            {/* Left Side: Weather Info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Weather</h1>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input
                                type="text"
                                placeholder="Search city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '0.6rem 1rem 0.6rem 2.5rem',
                                    borderRadius: '14px',
                                    border: '1px solid var(--border-light)',
                                    background: 'var(--input-bg)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    width: '200px',
                                    transition: 'all 0.2s'
                                }}
                            />
                        </div>
                    </form>
                </div>

                {error && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.85rem'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {!weatherData && !isLoading && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, gap: '1rem' }}>
                        <MapPin size={48} />
                        <p style={{ fontWeight: 500 }}>Enter a location to see the weather forecast</p>
                    </div>
                )}

                {isLoading && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={32} className="spin" style={{ opacity: 0.3 }} />
                    </div>
                )}

                {weatherData && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                    >
                        {/* Hero Section */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            background: 'var(--input-bg)',
                            borderRadius: '24px',
                            border: '1px solid var(--border-light)'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', opacity: 0.7 }}>
                                    <MapPinIcon size={14} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{weatherData.locationName}</span>
                                </div>
                                <div style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                    {weatherData.currentTemp}°
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.8 }}>
                                    {WEATHER_CODES[weatherData.weathercode[0]]?.label || 'Unknown'}
                                </div>
                            </div>
                            <div style={{ transform: 'scale(1.5)', marginRight: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                {WEATHER_CODES[weatherData.weathercode[0]]?.icon || <CloudSun size={48} />}
                                <button
                                    onClick={handleSetDefault}
                                    disabled={isDefault}
                                    title={isDefault ? "This is your home location" : "Set as your home location"}
                                    style={{
                                        background: isDefault ? 'var(--primary)' : 'transparent',
                                        color: isDefault ? 'white' : 'var(--text-muted)',
                                        border: isDefault ? 'none' : '1.5px solid var(--border-light)',
                                        borderRadius: '10px',
                                        padding: '4px 10px',
                                        fontSize: '0.6rem',
                                        fontWeight: 800,
                                        cursor: isDefault ? 'default' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: isDefault ? '0 4px 12px var(--primary-glow)' : 'none',
                                        opacity: isDefault ? 1 : 0.7,
                                        marginTop: '0.2rem'
                                    }}
                                    onMouseEnter={e => {
                                        if (!isDefault) {
                                            e.currentTarget.style.background = 'var(--input-bg)';
                                            e.currentTarget.style.opacity = '1';
                                            e.currentTarget.style.borderColor = 'var(--text-muted)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isDefault) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.opacity = '0.7';
                                            e.currentTarget.style.borderColor = 'var(--border-light)';
                                        }
                                    }}
                                >
                                    {isDefault ? <Check size={10} strokeWidth={3} /> : <Star size={10} />}
                                    {isDefault ? 'HOME' : 'SET AS HOME'}
                                </button>
                            </div>
                        </div>

                        {/* 7-Day Forecast */}
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', opacity: 0.5 }}>
                                7-Day Forecast
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {weatherData.time.map((time, i) => (
                                    <div key={time} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem 1.25rem',
                                        background: i === 0 ? 'var(--primary)' : 'var(--glass-bg)',
                                        color: i === 0 ? 'white' : 'var(--text-main)',
                                        borderRadius: '16px',
                                        border: i === 0 ? 'none' : '1px solid var(--border-light)',
                                        boxShadow: i === 0 ? '0 10px 20px -5px var(--primary-glow)' : 'none'
                                    }}>
                                        <div style={{ width: '60px', fontWeight: 600, fontSize: '0.9rem' }}>
                                            {i === 0 ? 'Today' : getDayName(time)}
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                            {React.cloneElement(WEATHER_CODES[weatherData.weathercode[i]]?.icon || <Cloud size={20} />, { size: 20 })}
                                        </div>
                                        <div style={{ width: '80px', textAlign: 'right', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', fontSize: '0.9rem', fontWeight: 600 }}>
                                            <span>{Math.round(weatherData.temperature_2m_max[i])}°</span>
                                            <span style={{ opacity: 0.5 }}>{Math.round(weatherData.temperature_2m_min[i])}°</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Right Side: Integrations Card */}
            <div style={{ width: '260px', flexShrink: 0, borderLeft: '1px solid var(--border-light)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Integrations</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Calendar Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Show in Calendar</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Display icons on calendar days</div>
                        </div>
                        <div
                            onClick={() => setWeatherSettings(prev => ({ ...prev, showInCalendar: !prev?.showInCalendar }))}
                            style={{
                                width: '40px',
                                height: '24px',
                                borderRadius: '12px',
                                background: weatherSettings?.showInCalendar ? 'var(--primary)' : 'var(--border-light)',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                flexShrink: 0
                            }}
                        >
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'white',
                                position: 'absolute',
                                top: '2px',
                                left: weatherSettings?.showInCalendar ? '18px' : '2px',
                                transition: 'all 0.3s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} />
                        </div>
                    </div>

                    {/* Task List Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Show on Task List</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Weekly forecast overview</div>
                        </div>
                        <div
                            onClick={() => setWeatherSettings(prev => ({ ...prev, showInTasks: !prev?.showInTasks }))}
                            style={{
                                width: '40px',
                                height: '24px',
                                borderRadius: '12px',
                                background: weatherSettings?.showInTasks ? 'var(--primary)' : 'var(--border-light)',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                flexShrink: 0
                            }}
                        >
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: 'white',
                                position: 'absolute',
                                top: '2px',
                                left: weatherSettings?.showInTasks ? '18px' : '2px',
                                transition: 'all 0.3s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

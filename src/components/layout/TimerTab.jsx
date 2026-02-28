import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TimerTab = ({ accentColor = '#3b82f6' }) => {
    const [secondsLeft, setSecondsLeft] = useState(25 * 60);
    const [totalTime, setTotalTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive && secondsLeft > 0) {
            timerRef.current = setInterval(() => {
                setSecondsLeft(prev => prev - 1);
            }, 1000);
        } else if (secondsLeft === 0) {
            setIsActive(false);
            if (!isMuted) {
                playAlarm();
            }
            clearInterval(timerRef.current);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, secondsLeft, isMuted]);

    const playAlarm = () => {
        // Simple synth beep if browser allows
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 1);
        } catch (e) {
            console.error('Audio context error:', e);
        }
    };

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setSecondsLeft(totalTime);
    };

    const setTime = (minutes) => {
        const secs = minutes * 60;
        setTotalTime(secs);
        setSecondsLeft(secs);
        setIsActive(false);
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const [isCustomInput, setIsCustomInput] = useState(false);
    const [customMinutes, setCustomMinutes] = useState('25');

    // Circle math
    const radius = 120;
    const stroke = 12;
    const circumference = 2 * Math.PI * radius;
    const progress = totalTime > 0 ? (secondsLeft / totalTime) : 0;
    // To make it decrease clockwise:
    // 1. svg scaleX(-1) or rotate(90deg)
    // 2. strokeDashoffset = -circumference * (1 - progress)
    const offset = -circumference * (1 - progress);

    const handleCustomSubmit = (e) => {
        e.preventDefault();
        const mins = parseInt(customMinutes);
        if (mins > 0 && mins < 1000) {
            setTime(mins);
            setIsCustomInput(false);
        }
    };

    const primaryColor = accentColor === '#ffffff' ? '#0f172a' : accentColor;

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            gap: '3rem'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    padding: '1.5rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2.5rem',
                    width: '100%',
                }}
            >
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TimerIcon size={20} style={{ color: primaryColor }} />
                        <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>Focus Timer</span>
                    </div>
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isMuted ? '#ef4444' : '#64748b',
                            padding: '8px',
                            borderRadius: '12px',
                            transition: 'all 0.2s',
                        }}
                    >
                        {isMuted ? <BellOff size={20} /> : <Bell size={20} />}
                    </button>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Background ring */}
                        <circle
                            cx="140" cy="140" r={radius}
                            fill="none"
                            stroke="rgba(0, 0, 0, 0.03)"
                            strokeWidth={stroke}
                        />
                        {/* Progress ring - Clockwise reduction */}
                        <motion.circle
                            cx="140" cy="140" r={radius}
                            fill="none"
                            stroke={primaryColor}
                            strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <span style={{
                            fontSize: '4.5rem',
                            fontWeight: 900,
                            letterSpacing: '-0.05em',
                            color: 'var(--text-main)',
                            lineHeight: 1
                        }}>
                            {formatTime(secondsLeft)}
                        </span>
                        <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginTop: '0.5rem'
                        }}>
                            {isActive ? 'Keep Focusing' : 'Paused'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <button
                        onClick={resetTimer}
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.05)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            color: 'var(--text-main)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                    >
                        <RotateCcw size={22} />
                    </button>

                    <button
                        onClick={toggleTimer}
                        style={{
                            width: '84px',
                            height: '84px',
                            borderRadius: '50%',
                            background: primaryColor,
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            boxShadow: `0 12px 28px -5px ${primaryColor}40`,
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            transform: isActive ? 'scale(0.96)' : 'scale(1)'
                        }}
                    >
                        {isActive ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" style={{ marginLeft: '4px' }} />}
                    </button>

                    <div style={{ width: '56px' }} />
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    width: '100%',
                    alignItems: 'center'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        background: 'rgba(0,0,0,0.03)',
                        padding: '0.4rem',
                        borderRadius: '20px',
                        width: 'fit-content'
                    }}>
                        {[5, 10, 25, 50].map(mins => (
                            <button
                                key={mins}
                                onClick={() => {
                                    setTime(mins);
                                    setIsCustomInput(false);
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '15px',
                                    border: 'none',
                                    background: !isCustomInput && totalTime === mins * 60 ? 'white' : 'transparent',
                                    color: !isCustomInput && totalTime === mins * 60 ? 'var(--text-main)' : 'var(--text-muted)',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: !isCustomInput && totalTime === mins * 60 ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                {mins}m
                            </button>
                        ))}
                        <button
                            onClick={() => setIsCustomInput(!isCustomInput)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '15px',
                                border: 'none',
                                background: isCustomInput ? 'white' : 'transparent',
                                color: isCustomInput ? 'var(--text-main)' : 'var(--text-muted)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: isCustomInput ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            Custom
                        </button>
                    </div>

                    <AnimatePresence>
                        {isCustomInput && (
                            <motion.form
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleCustomSubmit}
                                style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    width: '100%',
                                    maxWidth: '200px'
                                }}
                            >
                                <input
                                    type="number"
                                    min="1"
                                    max="999"
                                    value={customMinutes}
                                    onChange={(e) => setCustomMinutes(e.target.value)}
                                    placeholder="Min"
                                    className="glass-input"
                                    style={{
                                        padding: '0.6rem 1rem',
                                        textAlign: 'center',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        borderRadius: '16px'
                                    }}
                                    autoFocus
                                />
                                <button type="submit" className="btn-icon" style={{ borderRadius: '16px', background: primaryColor }}>
                                    Set
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default TimerTab;

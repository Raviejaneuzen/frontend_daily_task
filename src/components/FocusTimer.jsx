import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';

const FocusTimer = ({ externalDuration }) => {
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);

    // Sync with external duration if provided
    useEffect(() => {
        if (externalDuration) {
            setMinutes(externalDuration);
            setSeconds(0);
            setIsActive(true);
        }
    }, [externalDuration]);

    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                if (seconds > 0) {
                    setSeconds(seconds - 1);
                } else if (minutes > 0) {
                    setMinutes(minutes - 1);
                    setSeconds(59);
                } else {
                    // Timer finished
                    setIsActive(false);
                    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
                    audio.play();
                    if (!isBreak) {
                        setIsBreak(true);
                        setMinutes(5);
                    } else {
                        setIsBreak(false);
                        setMinutes(25);
                    }
                }
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, minutes, seconds, isBreak]);

    const toggle = () => setIsActive(!isActive);

    const reset = () => {
        setIsActive(false);
        setIsBreak(false);
        setMinutes(25);
        setSeconds(0);
    };

    return (
        <div style={{ background: 'var(--bg-dark)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {isBreak ? <><Coffee size={14} /> Break Time</> : 'Focus Session'}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '1rem', color: isBreak ? 'var(--success)' : 'var(--primary)' }}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button onClick={toggle} style={{ background: isActive ? 'var(--bg-card)' : 'var(--primary)', color: 'white', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isActive ? <Pause size={18} /> : <Play size={18} />} {isActive ? 'Pause' : 'Start'}
                </button>
                <button onClick={reset} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.5rem' }}>
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );
};

export default FocusTimer;

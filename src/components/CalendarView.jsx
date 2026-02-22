import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

const CalendarView = ({ tasks, onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
        days.push(i);
    }

    const getTasksForDay = (day) => {
        if (!day) return [];
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return tasks.filter(task => {
            // Check if date matches or falls within range
            if (task.date === dateStr) return true;
            if (task.end_date) {
                return dateStr >= task.date && dateStr <= task.end_date;
            }
            return false;
        });
    };

    return (
        <div style={{ background: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border)', padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CalendarIcon size={24} color="var(--primary)" />
                    {monthNames[month]} {year}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={prevMonth} style={{ padding: '0.5rem', borderRadius: '0.75rem', background: 'var(--bg-dark)', border: '1px solid var(--border)' }}><ChevronLeft size={20} /></button>
                    <button onClick={nextMonth} style={{ padding: '0.5rem', borderRadius: '0.75rem', background: 'var(--bg-dark)', border: '1px solid var(--border)' }}><ChevronRight size={20} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.5rem', flex: 1 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', padding: '0.5rem 0' }}>{d}</div>
                ))}
                {days.map((day, i) => {
                    const dayTasks = getTasksForDay(day);
                    const isToday = day && i - startDay + 1 === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                    return (
                        <div
                            key={i}
                            onClick={() => day && onDateClick && onDateClick(day, dayTasks)}
                            style={{
                                minWidth: 0,
                                overflow: 'hidden',
                                minHeight: '80px',
                                background: day ? 'var(--bg-dark)' : 'transparent',
                                borderRadius: '0.75rem',
                                border: day ? '1px solid var(--border)' : 'none',
                                padding: '0.5rem',
                                position: 'relative',
                                opacity: day ? 1 : 0.3,
                                cursor: day ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                                transform: day ? 'scale(1)' : 'none'
                            }}
                            onMouseEnter={(e) => { if (day) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--primary)'; } }}
                            onMouseLeave={(e) => { if (day) { e.currentTarget.style.background = 'var(--bg-dark)'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
                        >
                            {day && (
                                <>
                                    <span style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        color: isToday ? 'var(--primary)' : 'inherit',
                                        background: isToday ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>{day}</span>
                                    <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {dayTasks.slice(0, 3).map(t => (
                                            <div key={t.id} style={{
                                                fontSize: '0.65rem',
                                                padding: '2px 4px',
                                                background: t.category === 'Work' ? 'rgba(59, 130, 246, 0.2)' : t.category === 'Meeting' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                                                color: t.category === 'Work' ? '#60a5fa' : t.category === 'Meeting' ? '#34d399' : '#818cf8',
                                                borderRadius: '3px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                borderLeft: `2px solid ${t.priority === 'High' ? 'var(--error)' : 'transparent'}`
                                            }} title={t.title}>
                                                {t.title}
                                            </div>
                                        ))}
                                        {dayTasks.length > 3 && (
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                + {dayTasks.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;

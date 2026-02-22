import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api';
import FocusTimer from '../../components/FocusTimer';
import CalendarView from '../../components/CalendarView';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, X, List, LayoutGrid, ListTodo, Users, Table, ExternalLink, Lock, Eye, EyeOff, CalendarCheck } from 'lucide-react';

const DayScheduleModal = ({ data, onClose }) => {
    if (!data) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)',
                width: 'min(500px, 100%)',
                maxHeight: '80vh',
                borderRadius: '2rem',
                border: '1px solid var(--border)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Schedule for Day {data.day}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{data.tasks.length} activities planned</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'var(--bg-dark)', border: 'none', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
                    {data.tasks.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tasks for this day.</p>
                    ) : (
                        data.tasks.sort((a, b) => (a.start_time || '00:00').localeCompare(b.start_time || '00:00')).map(task => (
                            <div key={task.id} style={{
                                background: 'var(--bg-dark)',
                                padding: '1rem',
                                borderRadius: '1rem',
                                border: '1px solid var(--border)',
                                borderLeft: `4px solid ${task.priority === 'High' ? 'var(--error)' : 'var(--primary)'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{task.category}</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: task.priority === 'High' ? 'var(--error)' : 'var(--primary)' }}>{task.priority}</span>
                                </div>
                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>{task.title}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    <Clock size={12} /> {task.start_time || 'No time'} - {task.end_time || '-'}
                                </div>
                                {task.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>{task.description}</p>}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardContentView = () => {
    const {
        user,
        activeCategory,
        tasks,
        loading,
        fetchData,
        toggleTask,
        deleteTask,
        stats,
        credentials,
        deleteCredential,
        habits,
        notes,
        setNotes
    } = useOutletContext();

    const [filter, setFilter] = useState('today'); // 'today', 'weekly', 'all'
    const [viewMode, setViewMode] = useState('timeline'); // 'timeline', 'calendar'
    const [timerDuration, setTimerDuration] = useState(null);
    const [selectedDayData, setSelectedDayData] = useState(null); // { day, tasks }

    const toggleHabit = async (habitId) => {
        const today = new Date().toISOString().split('T')[0];
        await api.put(`/habits/${habitId}/toggle/${today}`);
        fetchData();
    };

    const saveNote = async () => {
        await api.post('/notes/', { content: notes, date: new Date().toISOString().split('T')[0] });
    };

    const TaskTable = ({ tasks, category, onToggle, onDelete, fetchData }) => {
        const [localTasks, setLocalTasks] = useState(tasks);
        const [filters, setFilters] = useState({});
        const [editingCell, setEditingCell] = useState(null); // { id, field }
        const [editValue, setEditValue] = useState("");
        const [showAddColumn, setShowAddColumn] = useState(false);
        const [newColumnName, setNewColumnName] = useState("");

        useEffect(() => {
            setLocalTasks(tasks);
        }, [tasks]);

        // Dynamically extract metadata keys across all tasks for custom columns
        const customColumns = Array.from(new Set(
            tasks.flatMap(t => Object.keys(t.metadata || {}))
        ));

        const getBaseColumns = () => {
            if (category === 'task') return ['title', 'description', 'date', 'priority', 'status', 'notes', 'remarks', 'path'];
            if (category === 'work') return ['start_time', 'end_time', 'title', 'status'];
            if (category === 'meeting') return ['start_time', 'end_time', 'title', 'description'];
            if (category === 'plan') return ['date', 'start_time', 'title', 'description', 'status'];
            return ['date', 'start_time', 'title', 'category', 'priority', 'status'];
        };

        const baseColumns = getBaseColumns();
        const allColumns = [...baseColumns, ...customColumns];

        // Filtering
        const displayTasks = localTasks.filter(task => {
            for (const key in filters) {
                if (!filters[key]) continue;
                const taskVal = (baseColumns.includes(key) ? task[key] : task.metadata?.[key]) || '';
                if (!String(taskVal).toLowerCase().includes(filters[key].toLowerCase())) return false;
            }
            return true;
        });

        const handleCellClick = (task, field) => {
            setEditingCell({ id: task.id, field });
            const val = baseColumns.includes(field) ? task[field] : task.metadata?.[field];
            setEditValue(val || "");
        };

        const handleCellChange = (e) => {
            setEditValue(e.target.value);
        };

        const handleCellBlur = async (task, field) => {
            if (!editingCell) return;
            setEditingCell(null);

            const isBase = baseColumns.includes(field);
            const oldVal = isBase ? task[field] : task.metadata?.[field];

            if (oldVal === editValue) return;

            // Optimistic update
            const updatedTasks = localTasks.map(t => {
                if (t.id === task.id) {
                    if (isBase) return { ...t, [field]: editValue };
                    return { ...t, metadata: { ...(t.metadata || {}), [field]: editValue } };
                }
                return t;
            });
            setLocalTasks(updatedTasks);

            // API Call
            try {
                const updatePayload = isBase ? { [field]: editValue } : { metadata: { ...(task.metadata || {}), [field]: editValue } };
                // Keep category same for backend routing
                updatePayload.category = task.category;
                await api.put(`/tasks/${task.id}`, updatePayload);
                if (fetchData) fetchData();
            } catch (err) {
                console.error("Failed to update cell:", err);
                if (fetchData) fetchData(); // Revert on failure
            }
        };

        const handleCellKeyDown = (e, task, field) => {
            if (e.key === 'Enter') {
                handleCellBlur(task, field);
            }
        };

        const handleAddColumn = async () => {
            if (!newColumnName.trim()) return;
            if (localTasks.length > 0) {
                const firstTask = localTasks[0];
                const updatedMeta = { ...(firstTask.metadata || {}), [newColumnName.trim()]: "" };
                try {
                    await api.put(`/tasks/${firstTask.id}`, { category: firstTask.category, metadata: updatedMeta });
                    if (fetchData) fetchData();
                } catch (err) {
                    console.error("Failed to add column", err);
                }
            }
            setNewColumnName("");
            setShowAddColumn(false);
        };

        const handleAddRow = async () => {
            try {
                const newTask = {
                    title: "New Item",
                    category: category === 'all' ? 'Task' : (category || 'Task'),
                    status: "Pending"
                };
                await api.post('/tasks/', newTask);
                if (fetchData) fetchData();
            } catch (err) {
                console.error("Failed to add row", err);
            }
        };

        return (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>SPREADSHEET VIEW</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {showAddColumn ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input autoFocus value={newColumnName} onChange={e => setNewColumnName(e.target.value)} placeholder="Column Name" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--text-main)' }} onKeyDown={e => e.key === 'Enter' && handleAddColumn()} />
                                <button onClick={handleAddColumn} style={{ padding: '0.3rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem' }}>Add</button>
                                <button onClick={() => setShowAddColumn(false)} style={{ padding: '0.3rem 1rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.75rem' }}>Cancel</button>
                            </div>
                        ) : (
                            <button onClick={() => setShowAddColumn(true)} style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}><Plus size={14} /> Add Column</button>
                        )}
                        <button onClick={handleAddRow} style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}><Plus size={14} /> Add Row</button>
                    </div>
                </div>

                {/* Table Container with definitive scrolling heights and overflow logic */}
                <div style={{ width: '100%', maxHeight: '600px', overflow: 'auto', background: 'var(--bg-dark)', borderRadius: '1rem', border: '1px solid var(--border)', position: 'relative' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: 'var(--text-main)', textAlign: 'left', minWidth: '1000px' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', backdropFilter: 'blur(10px)', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <tr>
                                {allColumns.map(col => {
                                    const uniqueValues = Array.from(new Set(localTasks.map(t => baseColumns.includes(col) ? t[col] : t.metadata?.[col]).filter(Boolean)));
                                    return (
                                        <th key={col} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', minWidth: '150px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <span style={{ fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>{col.replace('_', ' ')}</span>
                                                <select
                                                    value={filters[col] || ''}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                            const newFilters = { ...filters };
                                                            delete newFilters[col];
                                                            setFilters(newFilters);
                                                        } else {
                                                            setFilters({ ...filters, [col]: val });
                                                        }
                                                    }}
                                                    style={{ width: '100%', padding: '0.3rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-main)', cursor: 'pointer' }}
                                                >
                                                    <option value="" style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>All</option>
                                                    {uniqueValues.map(val => (
                                                        <option key={val} value={val} style={{ background: 'var(--bg-dark)', color: 'var(--text-main)' }}>{val}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </th>
                                    );
                                })}
                                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', width: '60px' }}>Act</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayTasks.map(task => (
                                <tr key={task.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', height: '40px' }}>
                                    {allColumns.map(col => {
                                        const isEditing = editingCell?.id === task.id && editingCell?.field === col;
                                        const isBase = baseColumns.includes(col);
                                        const val = isBase ? task[col] : task.metadata?.[col];

                                        return (
                                            <td key={col}
                                                onClick={() => handleCellClick(task, col)}
                                                style={{ padding: 0, borderRight: '1px solid var(--border)', position: 'relative', minWidth: '150px' }}
                                            >
                                                {isEditing ? (
                                                    <input
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={handleCellChange}
                                                        onBlur={() => handleCellBlur(task, col)}
                                                        onKeyDown={(e) => handleCellKeyDown(e, task, col)}
                                                        style={{ width: '100%', height: '100%', border: 'none', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--text-main)', padding: '0 1rem', outline: '2px solid var(--primary)', outlineOffset: '-2px', margin: 0, fontSize: '0.85rem', position: 'absolute', top: 0, left: 0 }}
                                                    />
                                                ) : (
                                                    <div style={{ padding: '0.5rem 1rem', width: '100%', height: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: val ? 'inherit' : 'var(--text-muted)', cursor: 'text', opacity: val ? 1 : 0.4 }}>
                                                        {val || '+'}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.2rem' }}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                            {displayTasks.length === 0 && (
                                <tr>
                                    <td colSpan={allColumns.length + 1} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No tasks found. Click "Add Row" to create the first record.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const VaultTable = ({ credentials, onDelete }) => {
        const [showPassword, setShowPassword] = useState({});

        const togglePassword = (id) => {
            setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
        };

        // Extract all dynamic metadata keys to create extra columns
        const metadataKeys = Array.from(new Set(
            credentials.flatMap(c => Object.keys(c.metadata || {}))
        ));

        return (
            <div style={{ width: '100%', overflowX: 'auto', background: 'var(--bg-dark)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: 'var(--text-main)', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                            {['Service', 'Type', 'Identifier', 'Password', ...metadataKeys, 'Actions'].map(col => (
                                <th key={col} style={{ padding: '1rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {credentials.map(cred => (
                            <tr key={cred.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem', fontWeight: '600' }}>{cred.service_name}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{cred.identifier_type}</td>
                                <td style={{ padding: '1rem' }}>{cred.identifier_value}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontFamily: 'monospace' }}>
                                            {showPassword[cred.id] ? cred.password : '••••••••'}
                                        </span>
                                        {cred.password && (
                                            <button onClick={() => togglePassword(cred.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                {showPassword[cred.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </td>
                                {metadataKeys.map(key => (
                                    <td key={key} style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                        {cred.metadata?.[key] || '-'}
                                    </td>
                                ))}
                                <td style={{ padding: '1rem' }}>
                                    <button onClick={() => onDelete(cred.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {credentials.length === 0 && (
                            <tr>
                                <td colSpan={5 + metadataKeys.length} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No credentials saved in the vault.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const filteredTasks = tasks.filter(task => {
        // 1. Filter by Category
        if (activeCategory !== 'all') {
            const taskCat = task.category?.toLowerCase() || '';
            const activeCat = activeCategory.toLowerCase();
            if (activeCat === 'task') {
                if (!(taskCat === 'task' || taskCat === 'personal' || taskCat === 'personal tasks')) return false;
            } else {
                if (taskCat !== activeCat) return false;
            }
        }

        // 2. Filter by Date (filter state: 'today', 'weekly', 'all')
        if (filter === 'all') return true;

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        if (filter === 'today') {
            if (task.date === todayStr) return true;
            if (task.end_date && task.date <= todayStr && task.end_date >= todayStr) return true;
            return false;
        }

        if (filter === 'weekly') {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            const nextWeekYyyy = nextWeek.getFullYear();
            const nextWeekMm = String(nextWeek.getMonth() + 1).padStart(2, '0');
            const nextWeekDd = String(nextWeek.getDate()).padStart(2, '0');
            const nextWeekStr = `${nextWeekYyyy}-${nextWeekMm}-${nextWeekDd}`;

            if (!task.date) return false;

            if (task.end_date) {
                return task.date <= nextWeekStr && task.end_date >= todayStr;
            }
            return task.date >= todayStr && task.date <= nextWeekStr;
        }

        return true;
    });

    return (
        <>
            {/* Center: Interactive Task Timeline */}
            <div className="glass-panel view-container" style={{ padding: '2rem', borderRadius: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: 0, height: '100%', boxSizing: 'border-box' }}>
                <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.025em' }}>Good Day, {user?.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={14} />
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-dark)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                            <button
                                onClick={() => setViewMode('timeline')}
                                style={{
                                    padding: '0.5rem',
                                    background: viewMode === 'timeline' ? 'var(--primary)' : 'transparent',
                                    color: viewMode === 'timeline' ? 'white' : 'var(--text-muted)',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                                title="Timeline"
                            >
                                <ListTodo size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                style={{
                                    padding: '0.5rem',
                                    background: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
                                    color: viewMode === 'calendar' ? 'white' : 'var(--text-muted)',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                                title="Calendar"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                style={{
                                    padding: '0.5rem',
                                    background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                                    color: viewMode === 'table' ? 'white' : 'var(--text-muted)',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                                title="Table View"
                            >
                                <Table size={18} />
                            </button>
                        </div>

                        {activeCategory !== 'vault' && (
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-dark)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                                {['today', 'weekly', 'all'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setFilter(t)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            background: filter === t ? 'var(--primary)' : 'transparent',
                                            color: filter === t ? 'white' : 'var(--text-muted)',
                                            borderRadius: '0.6rem',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Productivity Stats Grid */}
                {activeCategory !== 'vault' && activeCategory !== 'routine' && activeCategory !== 'plan' && (
                    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                        <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>Daily Progress</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)' }}>{stats?.today?.percentage || 0}%</span>
                        </div>
                        <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>Tasks Done</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--success)' }}>{stats?.today?.completed || 0}/{stats?.today?.total || 0}</span>
                        </div>
                        <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>All-Time</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f59e0b' }}>{stats?.total_tasks || 0}</span>
                        </div>
                    </div>
                )}

                {activeCategory === 'routine' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                        <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>Weekly Consistency</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)' }}>{stats?.routine?.weekly_consistency || 0}%</span>
                        </div>
                        <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>Active Streak</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--success)' }}>{stats?.routine?.streak || 0} Days</span>
                        </div>
                        <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>Monthly Target</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f59e0b' }}>{stats?.routine?.monthly_completed || 0}/{stats?.routine?.monthly_total || 0}</span>
                        </div>
                    </div>
                )}

                {activeCategory === 'plan' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                        <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>Upcoming Trips</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)' }}>{stats?.plan?.upcoming || 0}</span>
                        </div>
                        <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>Completed</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--success)' }}>{stats?.plan?.completed || 0}</span>
                        </div>
                        <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Planned</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f59e0b' }}>{stats?.plan?.total || 0}</span>
                        </div>
                    </div>
                )}

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {activeCategory === 'vault' ? (
                        <VaultTable
                            credentials={credentials}
                            onDelete={deleteCredential}
                        />
                    ) : viewMode === 'calendar' ? (
                        <CalendarView
                            tasks={tasks}
                            onDateClick={(day, dayTasks) => setSelectedDayData({ day, tasks: dayTasks })}
                        />
                    ) : viewMode === 'table' ? (
                        <TaskTable
                            tasks={filteredTasks}
                            category={activeCategory}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            fetchData={fetchData}
                        />
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Clock size={20} color="var(--primary)" />
                                    {activeCategory === 'all' ? 'Overall' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Timeline
                                </h2>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem', minHeight: 0, paddingBottom: '1rem' }}>
                                {loading ? <p>Loading your schedule...</p> :
                                    filteredTasks.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-dark)', borderRadius: '1rem', border: '1px dashed var(--border)' }}>
                                            <List size={32} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                                            <p style={{ color: 'var(--text-muted)' }}>No tasks found in <strong>{activeCategory}</strong> for <strong>{filter}</strong>.</p>
                                            {(activeCategory !== 'all' || filter !== 'all') && (
                                                <button
                                                    onClick={() => { setActiveCategory('all'); setFilter('all'); fetchData(); }}
                                                    style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                                >
                                                    Show All Tasks
                                                </button>
                                            )}
                                        </div>
                                    ) :
                                        filteredTasks.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(task => (
                                            <div key={task.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-dark)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)', borderLeft: `4px solid ${task.priority === 'High' ? 'var(--error)' : 'var(--primary)'}` }}>
                                                <button onClick={() => toggleTask(task.id, task.status)} style={{ background: task.status === 'Completed' ? 'var(--success)' : 'transparent', border: task.status === 'Completed' ? 'none' : '2px solid var(--border)', width: '24px', height: '24px', borderRadius: '50%', marginRight: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {task.status === 'Completed' && <CheckCircle2 size={16} color="white" />}
                                                </button>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <h4 style={{ margin: 0, textDecoration: task.status === 'Completed' ? 'line-through' : 'none', opacity: task.status === 'Completed' ? 0.6 : 1, fontSize: '1rem', fontWeight: '600' }}>{task.title}</h4>
                                                        {task.ai_generated && <span style={{ padding: '0.1rem 0.4rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', fontSize: '0.65rem', borderRadius: '0.25rem', border: '1px solid var(--primary)' }}>AI</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {task.start_time} - {task.end_time}</span>
                                                        <span style={{ fontWeight: '700', color: task.priority === 'High' ? 'var(--error)' : 'var(--primary)' }}>{task.priority} Priority</span>
                                                        {(filter !== 'today' || task.date !== new Date().toISOString().split('T')[0]) && <span>• {task.date}{task.end_date ? ` to ${task.end_date}` : ''}</span>}
                                                    </div>
                                                    {task.notes && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{task.notes}</p>}
                                                    {task.path && <a href={task.path} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none' }}>🔗 Reference</a>}
                                                    {task.metadata && Object.keys(task.metadata).length > 0 && (
                                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                            {Object.entries(task.metadata).map(([k, v]) => (
                                                                <span key={k} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                                                    <strong>{k}:</strong> {v}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => deleteTask(task.id)} style={{ padding: '0.5rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                            </div>
                                        ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Right Panel: Contextual focus based on category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem', minHeight: 0, height: '100%', boxSizing: 'border-box' }}>

                {/* Focus Timer: Prioritized in 'work' or 'all' */}
                {(activeCategory === 'work' || activeCategory === 'all') && (
                    <FocusTimer externalDuration={timerDuration} />
                )}

                {/* Habits: Prioritized in 'task' or 'all' */}
                {(activeCategory === 'task' || activeCategory === 'all') && (
                    <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><CheckCircle2 size={18} color="var(--success)" /> Daily Habits</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {habits.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No habits tracked. Start one via Chat!</p>}
                            {habits.map(habit => {
                                const today = new Date().toISOString().split('T')[0];
                                const isDone = habit.status?.[today];
                                return (
                                    <div key={habit.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-dark)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{habit.title}</span>
                                        <button
                                            onClick={() => toggleHabit(habit.id)}
                                            style={{
                                                background: isDone ? 'var(--success)' : 'transparent',
                                                border: isDone ? 'none' : '1.5px solid var(--border)',
                                                width: '22px',
                                                height: '22px',
                                                borderRadius: '6px',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Routine Attendance Log */}
                {activeCategory === 'routine' && (
                    <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><CalendarCheck size={18} color="var(--primary)" /> Attendance Log</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {filteredTasks.length === 0 ? (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No routine items for today. Ask Dhana Durga to schedule your Sign-in/out!</p>
                            ) : (
                                filteredTasks.map(item => (
                                    <div key={item.id} style={{ padding: '1rem', background: 'var(--bg-dark)', borderRadius: '1rem', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{item.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scheduled: {item.start_time}</div>
                                        </div>
                                        <button
                                            onClick={() => toggleTask(item.id, item.status)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: item.status === 'Completed' ? 'var(--success)' : 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.6rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {item.status === 'Completed' ? 'Logged' : 'Pin Now'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Meeting Summary: New component for 'meeting' view */}
                {activeCategory === 'meeting' && (
                    <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Users size={18} color="var(--primary)" /> Upcoming Attendees</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Focus on collaboration today. You have {filteredTasks.length} meetings scheduled.</p>
                    </div>
                )}

                <div style={{ flex: 1, minHeight: '200px', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '700' }}>{activeCategory === 'work' ? 'Work Notes' : activeCategory === 'meeting' ? 'Meeting Minutes' : 'Daily Notes'}</h3>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={saveNote}
                        placeholder="Type your notes here..."
                        style={{ width: '100%', flex: 1, background: 'transparent', resize: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', lineHeight: '1.6' }}
                    />
                </div>
            </div>

            <DayScheduleModal
                data={selectedDayData}
                onClose={() => setSelectedDayData(null)}
            />
        </>
    );
};

export default DashboardContentView;

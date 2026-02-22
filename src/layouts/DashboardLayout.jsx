import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Outlet, useLocation } from 'react-router-dom';
import api from '../api';
import AIChatbot from '../components/AIChatbot';
import Sidebar from '../components/Sidebar';
import { LogOut, Calendar, Clock, Plus, Trash2, CheckCircle2, Bot, X, List, LayoutGrid, ListTodo, Users, Table, ExternalLink, Lock, Eye, EyeOff, CalendarCheck } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const UpdatePasswordModal = ({ isOpen, onClose }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await api.post('/auth/update-password', { old_password: oldPassword, new_password: newPassword });
            setMessage('Password updated successfully!');
            setTimeout(onClose, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem' }} onClick={onClose}>
            <div className="modal-content" style={{ background: 'var(--bg-card)', width: 'min(400px, 100%)', borderRadius: '2rem', border: '1px solid var(--border)', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Update Password</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                {message ? (
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '0.75rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{message}</div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Current Password</label>
                            <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>New Password</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white' }} />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white' }} />
                        </div>
                        {error && <p style={{ color: 'var(--error)', fontSize: '0.75rem', textAlign: 'center', margin: '0 0 1rem 0' }}>{error}</p>}
                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', background: 'var(--primary)', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};


const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Derive active category from path
    const getActiveCategory = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'all';
        if (path.includes('personal')) return 'task';
        if (path.includes('work')) return 'work';
        if (path.includes('collab')) return 'meeting';
        if (path.includes('routine')) return 'routine';
        if (path.includes('plan')) return 'plan';
        if (path.includes('vault')) return 'vault';
        return 'all';
    };

    const activeCategory = getActiveCategory();

    const [tasks, setTasks] = useState([]);
    const [allTasksForContext, setAllTasksForContext] = useState([]);
    const [credentials, setCredentials] = useState([]);
    const [stats, setStats] = useState(null);
    const [habits, setHabits] = useState([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [isUpdatePasswordOpen, setIsUpdatePasswordOpen] = useState(false);

    // AI Chatbot State
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchData();
        return () => {
            setTasks([]);
            setAllTasksForContext([]);
        };
    }, [user, activeCategory]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const endpoint = activeCategory === 'all' ? '/tasks/' : `/tasks/?category=${activeCategory}`;

            const [tasksRes, contextRes, statsRes, habitsRes, notesRes] = await Promise.all([
                api.get(endpoint),
                api.get('/tasks/'), // Always fetch all tasks for AI context
                api.get(`/stats/${activeCategory === 'all' ? '' : `?category=${activeCategory}`}`),
                api.get('/habits/'),
                api.get('/notes/')
            ]);

            setTasks(tasksRes.data);
            setAllTasksForContext(contextRes.data);
            setStats(statsRes.data);
            setHabits(habitsRes.data);
            if (notesRes.data.length > 0) {
                setNotes(notesRes.data[notesRes.data.length - 1].content);
            }

            if (activeCategory === 'vault') {
                const credsRes = await api.get('/credentials/');
                setCredentials(credsRes.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (taskId, status) => {
        try {
            await api.put(`/tasks/${taskId}`, { status: status === 'Completed' ? 'Pending' : 'Completed' });
            fetchData();
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            fetchData();
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const deleteCredential = async (id) => {
        if (!window.confirm("Are you sure you want to delete this credential?")) return;
        try {
            await api.delete(`/credentials/${id}`);
            fetchData();
        } catch (error) {
            console.error("Error deleting credential:", error);
        }
    };


    return (
        <div className="animated-bg app-container" style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            {/* Left Drawer Sidebar */}
            <Sidebar
                activeCategory={activeCategory}
                onLogout={logout}
                onUpdatePassword={() => setIsUpdatePasswordOpen(true)}
            />

            {/* Main Application Area */}
            <div className="content-area" style={{ flex: 1, height: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gridTemplateRows: 'minmax(0, 1fr)', gap: '2rem', padding: '2rem', boxSizing: 'border-box', overflow: 'hidden', zIndex: 10 }}>
                {/* Center Content rendered by Outlet */}
                <Outlet context={{
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
                }} />
            </div>

            {/* AI Assistant Drawer */}
            {isChatbotOpen && (
                <div className="glass-panel" style={{
                    position: 'fixed',
                    bottom: '6.5rem',
                    right: '1.5rem',
                    width: 'min(420px, 90vw)',
                    height: '600px',
                    maxHeight: 'calc(100vh - 8rem)',
                    zIndex: 1000,
                    borderRadius: '2rem',
                    overflow: 'hidden',
                    animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', background: 'var(--primary)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Bot size={24} />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Dhana Durga AI</h3>
                        </div>
                        <button onClick={() => setIsChatbotOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <div style={{ height: 'calc(100% - 65px)' }}>
                        <AIChatbot contextTasks={allTasksForContext} onTaskAdded={fetchData} />
                    </div>
                </div>
            )}

            {/* Floating Action Button for AI Chatbot */}
            <button
                onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.5)',
                    zIndex: 999,
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isChatbotOpen ? 'scale(0.9) rotate(15deg)' : 'scale(1) rotate(0deg)'
                }}
                onMouseOver={(e) => !isChatbotOpen && (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseOut={(e) => !isChatbotOpen && (e.currentTarget.style.transform = 'scale(1)')}
            >
                {isChatbotOpen ? <X size={28} /> : <Bot size={28} />}
            </button>

            {/* Modals */}
            <UpdatePasswordModal
                isOpen={isUpdatePasswordOpen}
                onClose={() => setIsUpdatePasswordOpen(false)}
            />
        </div>
    );
};

export default DashboardLayout;

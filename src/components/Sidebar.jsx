import React from 'react';
import { NavLink } from 'react-router-dom';
import { Layout, CheckSquare, Briefcase, Users, Home, Lock, CalendarCheck, Map, LogOut } from 'lucide-react';

const Sidebar = ({ activeCategory, onLogout, onUpdatePassword }) => {
    const menuItems = [
        { path: '/dashboard', end: true, label: 'Overall Overview', icon: <Home size={20} />, color: '#5c67f2' },
        { path: '/dashboard/personal', label: 'Personal Space', icon: <CheckSquare size={20} />, color: '#8b5cf6' },
        { path: '/dashboard/work', label: 'Work Flow', icon: <Briefcase size={20} />, color: '#0ea5e9' },
        { path: '/dashboard/collab', label: 'Collab Loop', icon: <Users size={20} />, color: '#10b981' },
        { path: '/dashboard/routine', label: 'Daily Routine', icon: <CalendarCheck size={20} />, color: '#ec4899' },
        { path: '/dashboard/plan', label: 'Plan My Day', icon: <Map size={20} />, color: '#4f46e5' },
        { path: '/dashboard/vault', label: 'Secure Vault', icon: <Lock size={20} />, color: '#f59e0b' },
    ];

    return (
        <div className="glass-panel sidebar-container" style={{ width: '260px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100vh', padding: '1.5rem 1rem', zIndex: 10 }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Layout size={20} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Dhana Durga</h2>
            </div>

            <nav className="sidebar-nav" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.75rem',
                            background: isActive ? item.color : 'transparent',
                            color: isActive ? 'white' : 'var(--text-muted)',
                            fontSize: '0.9rem',
                            fontWeight: isActive ? '600' : '400',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            width: '100%',
                            textAlign: 'left'
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                <span style={{
                                    display: 'flex',
                                    color: isActive ? 'white' : item.color,
                                    transition: 'color 0.2s'
                                }}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--bg-dark)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <button
                    onClick={onUpdatePassword}
                    style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', width: '100%', fontSize: '0.85rem' }}
                    title="Update Password"
                >
                    <Lock size={16} /> Update Password
                </button>
                <button
                    onClick={onLogout}
                    style={{ padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', width: '100%' }}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Layout } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password);
            navigate('/');
        } catch (err) {
            alert('Registration failed. Please try again.');
        }
    };

    return (
        <div className="animated-bg">
            <div style={{ position: 'absolute', top: '10%', right: '15%', width: '300px', height: '300px', background: 'var(--primary)', borderRadius: '50%', filter: 'blur(100px)', opacity: '0.3', animation: 'float 6s ease-in-out infinite reverse' }}></div>
            <div style={{ position: 'absolute', bottom: '10%', left: '15%', width: '400px', height: '400px', background: '#ec4899', borderRadius: '50%', filter: 'blur(120px)', opacity: '0.2', animation: 'float 8s ease-in-out infinite' }}></div>

            <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '3rem', borderRadius: '1.5rem', width: '450px', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 1.5rem auto' }}>
                        <Layout size={28} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Join Dhana Durga</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Start your productivity journey with AI.</p>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', paddingLeft: '3rem' }} placeholder="Sarah Johnson" />
                    </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', paddingLeft: '3rem' }} placeholder="sarah@example.com" />
                    </div>
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', paddingLeft: '3rem' }} placeholder="••••••••" />
                    </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '1rem', background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '1rem', borderRadius: '0.75rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)' }}>
                    Create Free Account
                </button>

                <p style={{ marginTop: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Log in</Link>
                </p>
            </form>

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                    100% { transform: translateY(0px) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default Register;

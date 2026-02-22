import React, { useState } from 'react';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/reset-password', { token, new_password: password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Reset failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-dark)' }}>
                <p style={{ color: 'var(--error)' }}>Invalid reset link. Please request a new one.</p>
            </div>
        );
    }

    return (
        <div className="animated-bg">
            <div style={{ position: 'absolute', top: '15%', right: '20%', width: '250px', height: '250px', background: 'var(--primary)', borderRadius: '50%', filter: 'blur(90px)', opacity: '0.3', animation: 'float 7s ease-in-out infinite' }}></div>
            <div style={{ position: 'absolute', bottom: '15%', left: '20%', width: '300px', height: '300px', background: '#ec4899', borderRadius: '50%', filter: 'blur(100px)', opacity: '0.2', animation: 'float 9s ease-in-out infinite reverse' }}></div>

            <div className="glass-panel" style={{ padding: '3rem', borderRadius: '1.5rem', width: '450px', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 1.5rem auto' }}>
                        <Lock size={24} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>New Password</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Set a secure password for your account.</p>
                </div>

                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <CheckCircle2 size={48} color="var(--success)" />
                        </div>
                        <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Password Updated!</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Redirecting to login...</p>
                        <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Click here if you aren't redirected</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ width: '100%', paddingLeft: '3rem' }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    style={{ width: '100%', paddingLeft: '3rem' }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', padding: '1rem', background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '1rem', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>

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

export default ResetPassword;

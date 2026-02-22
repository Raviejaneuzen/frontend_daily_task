import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animated-bg">
            <div style={{ position: 'absolute', top: '15%', right: '20%', width: '250px', height: '250px', background: 'var(--primary)', borderRadius: '50%', filter: 'blur(90px)', opacity: '0.3', animation: 'float 7s ease-in-out infinite' }}></div>
            <div style={{ position: 'absolute', bottom: '15%', left: '20%', width: '300px', height: '300px', background: '#ec4899', borderRadius: '50%', filter: 'blur(100px)', opacity: '0.2', animation: 'float 9s ease-in-out infinite reverse' }}></div>

            <div className="glass-panel" style={{ padding: '3rem', borderRadius: '1.5rem', width: '450px', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 1.5rem auto' }}>
                        <Mail size={24} />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Forgot Password</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Enter your email to receive a reset link.</p>
                </div>

                {message ? (
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '0.75rem', marginBottom: '2rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        {message}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '2rem', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{ width: '100%', paddingLeft: '3rem' }}
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', padding: '1rem', background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '1rem', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
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

export default ForgotPassword;

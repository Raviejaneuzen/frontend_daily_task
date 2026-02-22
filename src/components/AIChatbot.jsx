import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Sparkles, Mic, Volume2, VolumeX, Image, X } from 'lucide-react';
import api from '../api';

const AIChatbot = ({ onTaskAdded, currentTasks, currentHabits, currentCredentials, onSetTimer }) => {
    const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi! I can help you plan your day. Just tell me what you need to do.' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const scrollRef = useRef(null);
    const recognitionRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            // Optionally auto-send if you want true voice-to-voice:
            // handleSend(transcript); 
        };
        recognition.start();
    };

    const speakText = (text) => {
        if (!isVoiceEnabled) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find a premium/natural female voice if possible
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Female"));
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input, image: selectedImage };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        const currentImage = selectedImage;

        setInput('');
        setSelectedImage(null);
        setLoading(true);

        try {
            // Send context so AI knows what "the gym task" or "it" refers to
            const contextStr = `
                Current Tasks: ${currentTasks.map(t => `${t.title} (${t.category})`).join(', ')}
                Current Habits: ${currentHabits.map(h => h.title).join(', ')}
                Current Credentials: ${currentCredentials ? currentCredentials.map(c => c.service_name).join(', ') : 'None'}
            `;

            const res = await api.post('/ai/chat', {
                text: `${currentInput}\n\nContext:\n${contextStr}`,
                image: currentImage
            });

            const botMsg = {
                role: 'bot',
                text: res.data.reply,
                whatsappLink: res.data.actions?.find(a => a.type === 'dispatch_schedule')?.whatsapp_link
            };
            setMessages(prev => [...prev, botMsg]);

            // Speak the response if voice is enabled
            speakText(res.data.reply);

            if (res.data.actions && res.data.actions.length > 0) {
                for (const action of res.data.actions) {
                    if (action.type === 'add_task') {
                        await api.post('/tasks/', { ...action.data, ai_generated: true });
                    }
                    else if (action.type === 'update_task') {
                        const target = currentTasks.find(t => t.title.toLowerCase().includes(action.target_title?.toLowerCase()));
                        if (target) {
                            await api.put(`/tasks/${target.id}`, action.data);
                        }
                    }
                    else if (action.type === 'delete_task') {
                        const target = currentTasks.find(t => t.title.toLowerCase().includes(action.target_title?.toLowerCase()));
                        if (target) {
                            await api.delete(`/tasks/${target.id}`);
                        }
                    }
                    else if (action.type === 'add_habit') {
                        await api.post('/habits/', action.data);
                    }
                    else if (action.type === 'set_timer') {
                        onSetTimer(action.minutes);
                    }
                    else if (action.type === 'dispatch_schedule' && action.whatsapp_link) {
                        // We now show a button instead of window.open to avoid popup blockers
                        console.log("WhatsApp link generated:", action.whatsapp_link);
                    }
                    else if (action.type === 'manage_credential') {
                        // Ensure required fields exist to prevent 422 Unprocessable Content
                        if (!action.data.service_name) action.data.service_name = "Unknown Service";
                        if (!action.data.identifier_value) action.data.identifier_value = "Unknown User";
                        if (!action.data.identifier_type) action.data.identifier_type = "username";

                        if (action.action === 'add') {
                            await api.post('/credentials/', action.data);
                        } else if (action.action === 'update') {
                            const target = currentCredentials?.find(c => c.service_name.toLowerCase().includes(action.data?.service_name?.toLowerCase()));
                            if (target) {
                                await api.put(`/credentials/${target.id}`, action.data);
                            }
                        } else if (action.action === 'delete') {
                            const target = currentCredentials?.find(c => c.service_name.toLowerCase().includes(action.data?.service_name?.toLowerCase()));
                            if (target) {
                                await api.delete(`/credentials/${target.id}`);
                            }
                        }
                    }
                }
                onTaskAdded(); // Refresh dashboard
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I couldn't process that right now. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bot size={20} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>Dhana Durga</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                        style={{ background: 'transparent', border: 'none', color: isVoiceEnabled ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title={isVoiceEnabled ? "Disable Voice Feedback" : "Enable Voice Feedback"}
                    >
                        {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                    <Sparkles size={16} color="var(--primary)" style={{ opacity: 0.7 }} />
                </div>
            </div>

            <div
                ref={scrollRef}
                style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
                {messages.map((m, i) => (
                    <div key={i} style={{
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                    }}>
                        <div
                            style={{
                                background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: m.role === 'user' ? 'white' : 'var(--text-main)',
                                padding: '0.75rem 1rem',
                                borderRadius: m.role === 'user' ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem',
                                maxWidth: '100%', // Adjusted to fit within parent's maxWidth
                                fontSize: '0.9rem',
                                lineHeight: '1.5',
                                boxShadow: m.role === 'user' ? '0 4px 12px -2px rgba(99, 102, 241, 0.3)' : 'none',
                                border: m.role === 'user' ? 'none' : '1px solid var(--border)'
                            }}
                        >
                            <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                            {m.image && (
                                <img
                                    src={m.image}
                                    alt="Uploaded"
                                    style={{
                                        marginTop: '0.75rem',
                                        maxWidth: '100%',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border)'
                                    }}
                                />
                            )}

                            {m.whatsappLink && (
                                <button
                                    onClick={() => window.open(m.whatsappLink, '_blank')}
                                    style={{
                                        marginTop: '0.75rem',
                                        padding: '0.5rem 1rem',
                                        background: '#25D366',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.75rem',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Send size={14} />
                                    Send via WhatsApp
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', background: 'var(--bg-dark)', padding: '0.5rem 1rem', borderRadius: '1rem' }}>
                        <Loader2 className="animate-spin" size={16} color="var(--primary)" />
                    </div>
                )}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', position: 'relative' }}>
                {selectedImage && (
                    <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '1rem',
                        marginBottom: '0.5rem',
                        padding: '0.25rem',
                        background: 'var(--bg-card)',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <img src={selectedImage} alt="Preview" style={{ height: '40px', borderRadius: '0.25rem' }} />
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{ background: 'rgba(255,0,0,0.1)', color: 'var(--error)', padding: '2px', borderRadius: '50%', display: 'flex' }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                <input
                    type="text"
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    style={{ width: '100%', padding: '0.75rem 6.5rem 0.75rem 1rem', fontSize: '0.85rem' }}
                />
                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        style={{ background: 'transparent', color: 'var(--text-muted)', padding: '0.4rem' }}
                    >
                        <Image size={18} />
                    </button>
                    <button
                        onClick={startListening}
                        style={{
                            background: 'transparent',
                            color: isListening ? 'var(--error)' : 'var(--text-muted)',
                            padding: '0.4rem',
                            animation: isListening ? 'pulse 1.5s infinite' : 'none'
                        }}
                    >
                        <Mic size={18} />
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        style={{
                            background: 'transparent',
                            color: 'var(--primary)',
                            padding: '0.4rem',
                            opacity: loading || !input.trim() ? 0.5 : 1
                        }}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default AIChatbot;

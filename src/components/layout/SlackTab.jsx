import React, { useState, useEffect } from 'react';
import {
    Hash, Send, LogOut, HelpCircle
} from 'lucide-react';

export default function SlackTab({ user }) {
    // 1. Check for stored User Token
    const [token, setToken] = useState(localStorage.getItem('slack_user_token') || '');
    const [isConnected, setIsConnected] = useState(!!token);
    const [loading, setLoading] = useState(false);

    // Data State
    const [channels, setChannels] = useState([]);
    const [activeChannel, setActiveChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [error, setError] = useState(null);

    // Initial Fetch if token exists on mount
    useEffect(() => {
        if (token) {
            fetchSlackData(token);
        }
    }, []);

    // 2. Fetch Helper (Direct to Proxy)
    const fetchSlackData = async (userToken) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch Channels
            const channelsRes = await fetch('/api/slack/proxy', {
                method: 'POST',
                body: JSON.stringify({
                    endpoint: 'conversations.list',
                    token: userToken,
                    types: 'public_channel,private_channel'
                })
            });
            const channelsData = await channelsRes.json();

            if (channelsData.ok) {
                const mappedChannels = channelsData.channels.map(c => ({
                    id: c.id,
                    name: c.name,
                    is_private: c.is_private,
                    unread: 0
                }));
                setChannels(mappedChannels);

                // Set initial active channel
                if (mappedChannels.length > 0) {
                    setActiveChannel({ id: mappedChannels[0].id, name: mappedChannels[0].name });
                }

                setIsConnected(true);
                localStorage.setItem('slack_user_token', userToken);
            } else {
                setError(`Connection failed: ${channelsData.error}`);
                if (channelsData.error === 'invalid_auth') {
                    setIsConnected(false);
                    localStorage.removeItem('slack_user_token');
                }
            }
        } catch (err) {
            console.error('Slack Fetch Error:', err);
            setError('Failed to connect to Slack API via Proxy');
        } finally {
            setLoading(false);
        }
    };

    // 3. Fetch Messages when Active Channel Changes
    useEffect(() => {
        if (token && activeChannel) {
            fetchMessages(activeChannel.id);
        }
    }, [activeChannel, token]);

    const fetchMessages = async (channelId) => {
        setLoading(true);
        try {
            const res = await fetch('/api/slack/proxy', {
                method: 'POST',
                body: JSON.stringify({
                    endpoint: 'conversations.history',
                    token,
                    channel: channelId,
                    limit: 20
                })
            });
            const data = await res.json();

            if (data.ok) {
                const msgs = data.messages.map(m => ({
                    id: m.ts,
                    user: m.user || 'Bot',
                    time: new Date(parseFloat(m.ts) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    content: m.text,
                    reactions: m.reactions ? m.reactions.map(r => ({ emoji: r.name, count: r.count })) : []
                })).reverse();
                setMessages(msgs);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = (e) => {
        e.preventDefault();
        if (token.startsWith('xox')) {
            fetchSlackData(token);
        } else {
            setError('Invalid token format. Must start with xoxb- or xoxp-');
        }
    };

    const handleLogout = () => {
        setToken('');
        localStorage.removeItem('slack_user_token');
        setIsConnected(false);
        setChannels([]);
        setMessages([]);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        // Optimistic UI
        const tempMsg = {
            id: Date.now(),
            user: 'You',
            time: 'Now',
            content: inputText,
            reactions: []
        };
        setMessages([...messages, tempMsg]);
        setInputText('');

        if (token && activeChannel) {
            try {
                await fetch('/api/slack/proxy', {
                    method: 'POST',
                    body: JSON.stringify({
                        endpoint: 'chat.postMessage',
                        token,
                        channel: activeChannel.id,
                        text: tempMsg.content
                    })
                });
            } catch (err) {
                console.error('Send failed', err);
            }
        }
    };

    // --- RENDER: LOGIN SCREEN ---
    if (!isConnected) {
        return (
            <div style={{
                height: '75vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#374151',
                textAlign: 'center',
                gap: '1.5rem',
                background: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.2)'
            }}>
                <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                    <Hash size={48} color="#4A154B" />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Connect Slack</h2>
                    <p style={{ color: '#6B7280', maxWidth: '400px', lineHeight: 1.6 }}>
                        Enter your <b>User OAuth Token</b> to view your channels and messages.
                        <br /><span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(Starts with xoxp- or xoxb-)</span>
                    </p>
                </div>

                <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '360px' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="password"
                            placeholder="xoxp-..."
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem 1rem',
                                border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '1rem', outline: 'none'
                            }}
                        />
                    </div>

                    {error && <div style={{ color: '#E01E5A', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        {error}
                    </div>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#4A154B', color: 'white', border: 'none', padding: '0.75rem',
                            borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'wait' : 'pointer',
                            boxShadow: '0 4px 12px rgba(74, 21, 75, 0.3)', transition: 'opacity 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Connecting...' : 'Connect Account'}
                    </button>

                    <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#6B7280', textDecoration: 'underline' }}>
                        Get Token from Slack API
                    </a>
                </form>
            </div>
        );
    }

    // --- RENDER: MAIN INTERFACE ---
    return (
        <div style={{
            height: '75vh', display: 'flex', background: 'white', borderRadius: '24px', overflow: 'hidden',
            boxShadow: '0 20px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)'
        }}>
            {/* Sidebar */}
            <div style={{ width: '260px', background: '#3F0E40', color: '#CFC3CF', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #5d2c5d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Workspace</h3>
                    <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CFC3CF' }} title="Logout">
                        <LogOut size={16} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0 1rem', fontSize: '0.8rem', fontWeight: 500, display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span>Channels</span>
                        </div>
                        {channels.map(channel => (
                            <div key={channel.id}
                                onClick={() => setActiveChannel(channel)}
                                style={{
                                    padding: '0.35rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: activeChannel?.id === channel.id ? '#1164A3' : 'transparent',
                                    color: activeChannel?.id === channel.id ? 'white' : '#CFC3CF',
                                    cursor: 'pointer'
                                }}>
                                <Hash size={14} style={{ opacity: 0.7 }} />
                                {channel.name}
                                {channel.is_private && <span style={{ fontSize: '0.7rem' }}>🔒</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                {/* Header */}
                <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: '#111827' }}>
                        <Hash size={16} color="#6B7280" />
                        {activeChannel?.name || 'select-channel'}
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <span style={{ color: '#6B7280' }}>Loading...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>No messages loaded</div>
                    ) : messages.map(msg => (
                        <div key={msg.id} style={{ padding: '0.5rem 1.25rem', display: 'flex', gap: '0.75rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4B5563', flexShrink: 0 }}>
                                {msg.user ? msg.user[0] : '?'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{msg.user}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{msg.time}</span>
                                </div>
                                <div style={{ color: '#374151', lineHeight: '1.5', marginTop: '0.1rem' }}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div style={{ padding: '1.25rem' }}>
                    <div style={{ border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
                        <form onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder={`Message #${activeChannel?.name || 'channel'}`}
                                style={{ width: '100%', padding: '0.75rem', border: 'none', outline: 'none', fontSize: '0.95rem', minHeight: '60px' }}
                            />
                            <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
                                <button type="submit" style={{ background: inputText.trim() ? '#007a5a' : '#E5E7EB', color: inputText.trim() ? 'white' : '#9CA3AF', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

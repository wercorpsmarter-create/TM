import React, { useState, useEffect } from 'react';
import {
    Hash, Send, LogOut, HelpCircle, Key, Lock
} from 'lucide-react';

export default function SlackTab({ user }) {
    const clientId = import.meta.env.VITE_SLACK_CLIENT_ID;

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

    // Initial check for OAuth flow or Token on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code && !token) {
            handleExchange(code);
        } else if (token) {
            fetchSlackData(token);
        }
    }, []);

    const handleExchange = async (code) => {
        setLoading(true);
        try {
            const res = await fetch('/api/slack/exchange', {
                method: 'POST',
                body: JSON.stringify({
                    code,
                    redirect_uri: window.location.origin + '/'
                })
            });
            const data = await res.json();

            if (data.ok) {
                // Determine token based on response structure (authed_user for v2, access_token for bot/legacy)
                const newToken = data.authed_user?.access_token || data.access_token;

                if (newToken) {
                    localStorage.setItem('slack_user_token', newToken);
                    setToken(newToken);
                    setIsConnected(true);
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    // Fetch data
                    fetchSlackData(newToken);
                } else {
                    setError('No access token returned');
                }
            } else {
                setError(data.error || 'Failed to exchange token');
            }
        } catch (err) {
            setError('Network error during exchange');
        } finally {
            setLoading(false);
        }
    };

    // 2. Fetch Helper (Direct to Proxy)
    const fetchSlackData = async (userToken) => {
        if (!userToken) return;
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
                // Sort private first, then alphabetical
                mappedChannels.sort((a, b) => (b.is_private === a.is_private) ? a.name.localeCompare(b.name) : (b.is_private ? 1 : -1));

                setChannels(mappedChannels);

                // Set initial active channel
                if (mappedChannels.length > 0) {
                    setActiveChannel({ id: mappedChannels[0].id, name: mappedChannels[0].name });
                }

                setIsConnected(true);
                // Ensure local storage is synced
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

    const handleConnectManual = (e) => {
        e.preventDefault();
        if (token.startsWith('xox')) {
            fetchSlackData(token);
        } else {
            setError('Invalid token format. Must start with xoxb- or xoxp-');
        }
    };

    const handleOAuthLogin = () => {
        if (!clientId) {
            setError('Missing VITE_SLACK_CLIENT_ID in .env');
            return;
        }
        const scope = 'channels:read,groups:read,im:read,mpim:read,chat:write,users:read';
        const redirectUri = window.location.origin + '/';
        const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=&user_scope=${scope}&redirect_uri=${redirectUri}`;
        window.location.href = url;
    };

    const handleLogout = () => {
        setToken('');
        localStorage.removeItem('slack_user_token');
        setIsConnected(false);
        setChannels([]);
        setMessages([]);
        // Clear query params if any
        window.history.replaceState({}, document.title, window.location.pathname);
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
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
                <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                    <Hash size={48} color="#4A154B" />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Connect Slack</h2>
                    <p style={{ color: '#6B7280', maxWidth: '400px', lineHeight: 1.6 }}>
                        Link your workspace to chat directly from Task Master.
                    </p>
                </div>

                {/* Option 1: One-Click OAuth */}
                {clientId && (
                    <div style={{ width: '100%', maxWidth: '360px' }}>
                        <button
                            onClick={handleOAuthLogin}
                            disabled={loading}
                            style={{
                                width: '100%',
                                background: '#4A154B', color: 'white', border: 'none', padding: '0.75rem',
                                borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'wait' : 'pointer',
                                boxShadow: '0 4px 12px rgba(74, 21, 75, 0.3)', transition: 'opacity 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            <img src="https://cdn.iconjb.com/static/icon/social/slack.svg" alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }} onError={(e) => e.target.style.display = 'none'} />
                            {loading ? 'Connecting...' : 'Connect with Slack'}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0', color: '#9CA3AF', fontSize: '0.85rem' }}>
                            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                            OR
                            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                        </div>
                    </div>
                )}

                {/* Option 2: Manual Token */}
                <form onSubmit={handleConnectManual} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '360px' }}>
                    <div style={{ position: 'relative' }}>
                        <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                            type="password"
                            placeholder="Paste User Token (xoxp-...)"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                                border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '0.9rem', outline: 'none',
                                background: '#F9FAFB'
                            }}
                        />
                    </div>

                    {error && <div style={{ color: '#E01E5A', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        {error}
                    </div>}

                    {!clientId && (
                        <button
                            type="submit"
                            disabled={loading || !token}
                            style={{
                                background: '#374151', color: 'white', border: 'none', padding: '0.75rem',
                                borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: (loading || !token) ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 12px rgba(55, 65, 81, 0.2)', transition: 'opacity 0.2s',
                                opacity: (loading || !token) ? 0.7 : 1
                            }}
                        >
                            Connect Manually
                        </button>
                    )}
                </form>

                <div style={{ marginTop: '0.5rem' }}>
                    <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#6B7280', textDecoration: 'underline' }}>
                        Where do I find my token?
                    </a>
                </div>
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
                        {channels.length === 0 && !loading && (
                            <div style={{ padding: '0 1rem', fontSize: '0.8rem', opacity: 0.7 }}>No channels found</div>
                        )}
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
                                {channel.is_private && <Lock size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
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

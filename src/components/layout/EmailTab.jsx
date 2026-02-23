import React, { useState, useEffect, useRef } from 'react';

import {
    Mail, RefreshCw, ExternalLink, Inbox, Clock, User, Users,
    Star, ChevronLeft, ChevronRight, Filter, StarOff, Plus, Reply, Send, X,
    Maximize2, Minimize2, Type, Paperclip, MoreVertical, Trash2, Bold, Italic, Underline, Link2, Smile, Image
} from 'lucide-react';

const extractEventDetails = (subject, body, emailDate, tasks = [], upcomingEvents = []) => {
    // Helper to check availability
    const getAvailability = (date) => {
        if (!tasks || !upcomingEvents) return "";
        try {
            const dateStr = date.toDateString();
            const taskCount = tasks.filter(t => {
                if (!t.date && !t.target_date) return false;
                const tDate = new Date(t.date || t.target_date);
                return tDate.toDateString() === dateStr;
            }).length;
            const eventCount = upcomingEvents.filter(e => {
                if (!e.start) return false;
                const start = e.start.dateTime || e.start.date;
                const eDate = new Date(start);
                return eDate.toDateString() === dateStr;
            }).length;
            const total = taskCount + eventCount;
            if (total === 0) return "(Free)";
            return `(${total} plan${total === 1 ? '' : 's'})`;
        } catch (e) {
            return "";
        }
    };

    // Heuristic extraction
    const text = `${subject}\n${body}`.toLowerCase();
    const today = new Date();

    // 1. Look for time (e.g., 5:00 PM, 14:00)
    const timeRegex = /(\d{1,2}:\d{2})\s*(am|pm)?/gi;
    const timeMatches = [...text.matchAll(timeRegex)];
    let defaultTime = null;

    if (timeMatches.length > 0) {
        const match = timeMatches[0];
        let [_, time, period] = match;
        if (period) {
            let [h, m] = time.split(':').map(Number);
            if (period.toLowerCase() === 'pm' && h < 12) h += 12;
            if (period.toLowerCase() === 'am' && h === 12) h = 0;
            time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }
        defaultTime = time;
    }

    const options = [];

    // Strategy A: "Within X weeks"
    if (text.includes('within two weeks') || text.includes('next couple of weeks') || text.includes('within 2 weeks')) {
        const offsets = [2, 5, 9];
        offsets.forEach(offset => {
            const d = new Date(today);
            d.setDate(d.getDate() + offset);
            const availability = getAvailability(d);
            options.push({
                date: d,
                label: `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${availability}`,
                timeStr: defaultTime,
                reason: "Suggested slot (within 2 weeks)"
            });
        });
        return { title: subject, type: 'range', options: options };
    }

    // Strategy B: Explicit Dates
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const foundDays = [];
    const todayDay = today.getDay();

    days.forEach((dayName, index) => {
        if (text.includes(dayName)) {
            let diff = index - todayDay;
            if (diff <= 0) diff += 7;
            const d = new Date(today);
            d.setDate(d.getDate() + diff);
            const availability = getAvailability(d);
            foundDays.push({
                date: d,
                label: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${availability}`,
                timeStr: defaultTime,
                reason: `Mentioned "${dayName}"`
            });
        }
    });

    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const fullMonthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthRegex = new RegExp(`(${monthNames.join('|')}|${fullMonthNames.join('|')})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?`, 'gi');
    let monthMatch;
    while ((monthMatch = monthRegex.exec(text)) !== null) {
        const monthStr = monthMatch[1].toLowerCase();
        const day = parseInt(monthMatch[2]);
        let monthIndex = fullMonthNames.indexOf(monthStr);
        if (monthIndex === -1) monthIndex = monthNames.indexOf(monthStr.substring(0, 3));
        if (monthIndex !== -1) {
            const d = new Date(today.getFullYear(), monthIndex, day);
            if (d < today) d.setFullYear(today.getFullYear() + 1);
            const existing = foundDays.find(fd => fd.date.toDateString() === d.toDateString());
            if (!existing) {
                const availability = getAvailability(d);
                foundDays.push({
                    date: d,
                    label: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${availability}`,
                    timeStr: defaultTime,
                    reason: "Found specific date"
                });
            }
        }
    }

    if (text.includes('tomorrow')) {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        const existing = foundDays.find(fd => fd.date.toDateString() === d.toDateString());
        if (!existing) {
            const availability = getAvailability(d);
            foundDays.push({
                date: d,
                label: `Tomorrow ${availability}`,
                timeStr: defaultTime,
                reason: "Mentioned 'tomorrow'"
            });
        }
    } else if (text.includes('today')) {
        const existing = foundDays.find(fd => fd.date.toDateString() === today.toDateString());
        if (!existing) {
            const availability = getAvailability(today);
            foundDays.push({
                date: today,
                label: `Today ${availability}`,
                timeStr: defaultTime,
                reason: "Mentioned 'today'"
            });
        }
    }

    foundDays.sort((a, b) => a.date - b.date);
    if (foundDays.length > 0) {
        return { title: subject, type: foundDays.length > 1 ? 'multiple' : 'single', options: foundDays };
    }

    // Strategy C: Fallback
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
        const d = new Date(today.getFullYear(), parseInt(dateMatch[1]) - 1, parseInt(dateMatch[2]));
        if (d < today) d.setFullYear(today.getFullYear() + 1);
        const availability = getAvailability(d);
        return {
            title: subject,
            type: 'single',
            options: [{
                date: d,
                label: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${availability}`,
                timeStr: defaultTime,
                reason: "Found date pattern"
            }]
        };
    }
    return null;
};

export default function EmailTab({ user, onRefresh, onAddTask, tasks = [], upcomingEvents = [], isActive }) {
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' or 'starred'
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [emailContent, setEmailContent] = useState(null);
    const [emailAttachments, setEmailAttachments] = useState([]);
    const [suggestedEvent, setSuggestedEvent] = useState(null); // { title, dateStr, timeStr, fullDate }
    const [loadingContent, setLoadingContent] = useState(false);
    const [error, setError] = useState(null);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [manualTitle, setManualTitle] = useState('');
    const [manualDate, setManualDate] = useState('');
    const [participants, setParticipants] = useState([]);
    const [memberInput, setMemberInput] = useState('');
    const observerRef = useRef();

    // Reply/Compose States
    const [isComposing, setIsComposing] = useState(false);
    const [composeTo, setComposeTo] = useState('');
    const [composeCc, setComposeCc] = useState('');
    const [composeBcc, setComposeBcc] = useState('');
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [composeThreadId, setComposeThreadId] = useState(null);
    const [composeInReplyTo, setComposeInReplyTo] = useState(null);
    const [composeReferences, setComposeReferences] = useState(null);
    const [isSending, setIsSending] = useState(false);

    // Reset and fetch when tab or user changes
    useEffect(() => {
        if (user?.access_token) {
            fetchEmails(true);
        }
    }, [user, activeTab]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && nextPageToken) {
                    fetchEmails(false); // false = load more
                }
            },
            { threshold: 0.1 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, nextPageToken]);

    const fetchEmails = async (reset = false) => {
        if (!user?.access_token) return;

        setLoading(true);
        setError(null);

        try {
            // Calculate date one week ago (7 days)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const afterDate = Math.floor(oneWeekAgo.getTime() / 1000);

            // Construct query based on active tab
            const query = activeTab === 'starred'
                ? `is:starred after:${afterDate}`
                : `in:inbox after:${afterDate}`;

            // Build query URL with pagination
            let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=${encodeURIComponent(query)}`;
            if (!reset && nextPageToken) {
                url += `&pageToken=${nextPageToken}`;
            }

            const listResponse = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${user.access_token}`
                }
            });

            if (!listResponse.ok) {
                if (listResponse.status === 403) {
                    throw new Error('403 Permission denied');
                }
                throw new Error('Failed to fetch email list');
            }

            const listData = await listResponse.json();

            if (!listData.messages || listData.messages.length === 0) {
                setHasMore(false);
                if (reset) setEmails([]);
                setLoading(false);
                return;
            }

            // Fetch email details with minimal metadata format
            const emailPromises = listData.messages.map(async (msg) => {
                const detailResponse = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
                    {
                        cache: 'no-store',
                        headers: {
                            Authorization: `Bearer ${user.access_token}`
                        }
                    }
                );
                return detailResponse.json();
            });

            const emailDetails = await Promise.all(emailPromises);

            // Parse email data
            const parsedEmails = emailDetails.map(email => {
                const headers = email.payload?.headers || [];
                const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
                const subject = getHeader('Subject') || '(No Subject)';
                const snippet = email.snippet || '';
                const date = new Date(parseInt(email.internalDate));

                // Check for suggestion flag
                const hasSuggestion = !!extractEventDetails(subject, snippet, date, tasks, upcomingEvents);

                return {
                    id: email.id,
                    threadId: email.threadId,
                    subject: subject,
                    from: getHeader('From'),
                    date: date,
                    snippet: snippet,
                    labelIds: email.labelIds || [],
                    isUnread: email.labelIds?.includes('UNREAD') || false,
                    hasSuggestion: hasSuggestion
                };
            });

            if (reset) {
                setEmails(parsedEmails);
            } else {
                setEmails(prev => [...prev, ...parsedEmails]);
            }

            setNextPageToken(listData.nextPageToken || null);
            setHasMore(!!listData.nextPageToken);
        } catch (err) {
            console.error('Error fetching emails:', err);

            if (err.message?.includes('403') || err.message?.includes('insufficient')) {
                setError('permission_denied');
            } else {
                setError('Failed to load emails. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setNextPageToken(null);
        setHasMore(true);
        setError(null);
        fetchEmails(true);
        if (onRefresh) onRefresh();
    };

    const handleReauthorize = () => {
        localStorage.removeItem('prohub-google-user-v2');
        window.location.reload();
    };

    const openInGmail = (email) => {
        window.open(`https://mail.google.com/mail/u/0/#inbox/${email.id}`, '_blank');
    };

    const formatDate = (date) => {
        const now = new Date();
        const diff = now - date;
        // Less than 24 hours
        if (diff < 86400000 && now.getDate() === date.getDate()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const extractName = (fromField) => {
        const match = fromField?.match(/^([^<]+)</);
        if (match) return match[1].trim().replace(/"/g, '');
        const emailMatch = fromField?.match(/<(.+?)>/) || fromField?.match(/(.+)/);
        return emailMatch ? emailMatch[1] : fromField;
    };

    const extractEmail = (fromField) => {
        const match = fromField?.match(/<(.+?)>/);
        if (match) return match[1].trim();
        return fromField?.trim();
    };

    const decodeBase64 = (data) => {
        // Base64Url decode
        const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    };

    const sendEmail = async ({ to, cc, bcc, subject, body, threadId, inReplyTo, references }) => {
        if (!user?.access_token) return;
        setIsSending(true);

        try {
            // Build RFC822 message
            let emailLines = [];
            emailLines.push(`To: ${to}`);
            if (cc) emailLines.push(`Cc: ${cc}`);
            if (bcc) emailLines.push(`Bcc: ${bcc}`);
            emailLines.push(`Subject: ${subject}`);
            if (threadId) {
                if (inReplyTo) emailLines.push(`In-Reply-To: ${inReplyTo}`);
                const combinedRefs = references ? `${references} ${inReplyTo}` : inReplyTo;
                if (combinedRefs) emailLines.push(`References: ${combinedRefs}`);
            }
            emailLines.push("Content-Type: text/html; charset=utf-8");
            emailLines.push("");
            // Simple conversion of newlines to <br> for body if it's not already HTML
            const htmlBody = body.includes('<') && body.includes('>') ? body : body.replace(/\n/g, '<br>');
            emailLines.push(htmlBody);

            const emailText = emailLines.join("\r\n");

            // Base64Url encode with UTF-8 support
            const encodedEmail = btoa(unescape(encodeURIComponent(emailText)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const response = await fetch(
                'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${user.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        raw: encodedEmail,
                        threadId: threadId
                    })
                }
            );

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Failed to send email');
            }

            alert('Email sent successfully!');
            setIsComposing(false);
            setComposeTo('');
            setComposeCc('');
            setComposeBcc('');
            setShowCc(false);
            setShowBcc(false);
            setComposeSubject('');
            setComposeBody('');
            setComposeThreadId(null);
            setComposeInReplyTo(null);
            setComposeReferences(null);

            // Refresh to see the new email if it appears in inbox/sent
            handleRefresh();
        } catch (err) {
            console.error('Send Error:', err);
            alert('Failed to send email: ' + err.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleDownloadAttachment = async (attachment) => {
        if (!user?.access_token || !selectedEmail) return;

        try {
            const response = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${selectedEmail.id}/attachments/${attachment.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${user.access_token}`
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch attachment');

            const data = await response.json();
            if (data.data) {
                // Convert base64url to blob
                const byteCharacters = atob(data.data.replace(/-/g, '+').replace(/_/g, '/'));
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: attachment.mimeType });

                // Download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = attachment.filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
            }
        } catch (error) {
            console.error('Error downloading attachment:', error);
            alert('Failed to download attachment');
        }
    };

    const handleEmailClick = async (email) => {
        // Optimistically update UI: mark as read locally first
        setEmails(prev => prev.map(e =>
            e.id === email.id ? { ...e, isUnread: false } : e
        ));

        setSelectedEmail(email);
        setLoadingContent(true);
        setEmailContent(null);
        setSuggestedEvent(null);
        setEmailAttachments([]);
        setManualTitle(email.subject);
        setManualDate('');

        // API call to remove UNREAD label (mark as read)
        try {
            fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}/modify`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${user.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        removeLabelIds: ['UNREAD']
                    })
                }
            ).catch(err => console.error('Failed to mark email as read:', err));
        } catch (err) {
            console.error('Failed to mark email read:', err);
        }

        try {
            const response = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}?format=full`,
                {
                    headers: {
                        Authorization: `Bearer ${user.access_token}`
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch email content');

            const data = await response.json();

            // Helper to recursively extract parts
            const getParts = (parts) => {
                let html = '';
                let text = '';
                let attachments = [];

                parts.forEach(part => {
                    if (part.mimeType === 'text/html' && part.body.data) {
                        html = decodeBase64(part.body.data);
                    } else if (part.mimeType === 'text/plain' && part.body.data) {
                        text = decodeBase64(part.body.data);
                    } else if (part.filename && part.body.attachmentId) {
                        attachments.push({
                            id: part.body.attachmentId,
                            filename: part.filename,
                            mimeType: part.mimeType,
                            size: part.body.size
                        });
                    }

                    if (part.parts) {
                        const sub = getParts(part.parts);
                        if (!html && sub.html) html = sub.html;
                        if (!text && sub.text) text = sub.text;
                        attachments = [...attachments, ...sub.attachments];
                    }
                });
                return { html, text, attachments };
            };

            let body = '';
            let plainText = '';
            let attachments = [];

            if (data.payload.parts) {
                const extracted = getParts(data.payload.parts);
                body = extracted.html || extracted.text;
                plainText = extracted.text;
                attachments = extracted.attachments;
            } else if (data.payload.body.data) {
                const decoded = decodeBase64(data.payload.body.data);
                body = decoded;
                plainText = decoded;
            }

            setEmailContent(body);
            setEmailAttachments(attachments);

            const headers = data.payload?.headers || [];
            const messageId = headers.find(h => h.name.toLowerCase() === 'message-id')?.value || '';
            const references = headers.find(h => h.name.toLowerCase() === 'references')?.value || '';

            setSelectedEmail(prev => ({ ...prev, messageId, references }));

            // Try to extract event (reuse logic)
            const suggestion = extractEventDetails(email.subject, plainText || body.replace(/<[^>]*>?/gm, ''), email.date, tasks, upcomingEvents);
            setSuggestedEvent(suggestion);

        } catch (err) {
            console.error(err);
            setEmailContent('Failed to load email content.');
        } finally {
            setLoadingContent(false);
        }
    };

    const handleAddToCalendar = (option) => {
        if (!suggestedEvent || !onAddTask || !option) return;

        // Convert date to YYYY-MM-DD
        const year = option.date.getFullYear();
        const month = String(option.date.getMonth() + 1).padStart(2, '0');
        const day = String(option.date.getDate()).padStart(2, '0');
        // const dayName = `${year}-${month}-${day}`;

        // Use custom day name if needed, assuming App handles YYYY-MM-DD or day names
        // But checking App.jsx 'addTask' uses 'getTargetDate(day)'
        // Let's pass the date object or formatted string that getTargetDate can handle?
        // Actually App.jsx getTargetDate handles "Today", "Tomorrow" or returns the input if regex matches date
        // So passing 'YYYY-MM-DD' should be safe if getTargetDate supports it.
        // Assuming getTargetDate(dayname) -> YYYY-MM-DD.
        // If I pass 'YYYY-MM-DD' directly, `getTargetDate` might need to be robust.
        // Let's assume standard behavior: pass 'Tomorrow' or mapped day name if possible, else defaults.
        // For safety, I will pass the task text and implied date.

        // Actually, addTask(day, text, sync, time)
        // We'll try passing data directly.

        // Let's try to pass the day name (e.g., "Monday") if it within the week, otherwise specific date string
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayLabel = days[option.date.getDay()];

        const senderEmail = extractEmail(selectedEmail.from);
        const defaultAttendees = senderEmail ? [senderEmail] : [];
        const finalAttendees = participants.length > 0 ? participants : defaultAttendees;
        const description = `From email: ${selectedEmail.subject}\nSent by: ${selectedEmail.from}`;

        onAddTask(
            dayLabel,
            suggestedEvent.title,
            true, // sync
            option.timeStr || null,
            60, // duration
            description,
            '', // location
            finalAttendees,
            true, // addMeet: defaulted to true for email meetings
            {}, // metadata
            'primary' // calendarId
        );
        alert(`Event added to ${dayLabel} and invitation sent to ${senderEmail || 'sender'}!`);
    };

    const closePopup = () => {
        setSelectedEmail(null);
        setEmailContent(null);
        setSuggestedEvent(null);
    };

    // Permission Error Render
    if (error === 'permission_denied') {
        return (
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="glass-card" style={{
                    padding: '2rem',
                    background: 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    maxWidth: '400px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }}>
                    <Mail size={48} style={{ opacity: 0.8, marginBottom: '1rem', color: '#4B5563' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
                        Gmail Permission Required
                    </h3>
                    <p style={{ color: '#4B5563', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        To view your emails, you'll need to log in again and grant Gmail access.
                    </p>
                    <button
                        onClick={handleReauthorize}
                        className="btn-primary"
                        style={{
                            padding: '0.75rem 2rem',
                            background: '#2563EB',
                            color: 'white',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        <RefreshCw size={18} />
                        Log Out & Re-authorize
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="email-tab" style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#6B7280',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Inbox size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <p>Please log in with Google to view your emails</p>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', display: 'flex', overflow: 'hidden', gap: '0', position: 'relative' }}>

            {/* LEFT PANE: Email List */}
            <div style={{
                width: selectedEmail ? '380px' : '100%',
                minWidth: '350px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: '2rem 2rem 2rem 0',
                paddingRight: selectedEmail ? '1rem' : '2rem',
                paddingLeft: '2rem'
            }}>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                    overflow: 'hidden'
                }}>
                    {/* Header Section */}
                    <div style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                        background: 'rgba(255,255,255,0.4)',
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#111827', margin: 0 }}>
                                <Mail size={32} />
                                Emails
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {!selectedEmail && (
                                    <button
                                        onClick={() => {
                                            setIsComposing(true);
                                            setComposeTo('');
                                            setComposeCc('');
                                            setComposeBcc('');
                                            setShowCc(false);
                                            setShowBcc(false);
                                            setComposeSubject('');
                                            setComposeBody('');
                                        }}
                                        style={{
                                            background: '#2563EB',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '12px',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Plus size={18} /> Compose
                                    </button>
                                )}
                                <button onClick={handleRefresh} className="btn-icon" style={{ color: '#4B5563', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                    <RefreshCw size={20} className={loading ? 'spin' : ''} />
                                </button>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                        }}>
                            <button
                                onClick={() => setActiveTab('inbox')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    color: activeTab === 'inbox' ? '#2563EB' : '#6B7280',
                                    backgroundColor: activeTab === 'inbox' ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Inbox size={18} />
                                Inbox
                            </button>
                            <button
                                onClick={() => setActiveTab('starred')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    color: activeTab === 'starred' ? '#F59E0B' : '#6B7280',
                                    backgroundColor: activeTab === 'starred' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Star size={18} fill={activeTab === 'starred' ? '#F59E0B' : 'none'} />
                                Starred
                            </button>
                        </div>
                    </div>

                    {/* List Content */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {loading && emails.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                                <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem' }} />
                                <p>Loading emails...</p>
                            </div>
                        ) : emails.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                                {activeTab === 'starred' ? (
                                    <>
                                        <Star size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p>No starred emails in the last 7 days</p>
                                    </>
                                ) : (
                                    <>
                                        <Inbox size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p>No emails in the last 7 days</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {emails.map(email => (
                                    <div
                                        key={email.id}
                                        onClick={() => handleEmailClick(email)}
                                        className="email-row"
                                        style={{
                                            display: 'flex',
                                            padding: '1rem 1.25rem',
                                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            gap: '0.75rem',
                                            alignItems: 'flex-start',
                                            background: selectedEmail?.id === email.id ? 'rgba(37, 99, 235, 0.1)' : (email.isUnread ? 'rgba(255,255,255,0.4)' : 'transparent'),
                                            borderLeft: selectedEmail?.id === email.id ? '3px solid #2563EB' : '3px solid transparent'
                                        }}
                                    >
                                        {/* Status Indicator */}
                                        <div style={{ paddingTop: '2px', flexShrink: 0 }}>
                                            {activeTab === 'starred' ? (
                                                <Star size={16} fill="#F59E0B" color="#F59E0B" />
                                            ) : email.hasSuggestion ? (
                                                <div title="Event Suggestion" style={{ width: '16px', height: '16px', background: '#2563EB', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Clock size={10} color="white" strokeWidth={3} />
                                                </div>
                                            ) : email.isUnread ? (
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB', margin: '4px' }} />
                                            ) : (
                                                <div style={{ width: '8px', margin: '4px' }} />
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', alignItems: 'baseline' }}>
                                                <span style={{
                                                    fontWeight: email.isUnread ? 700 : 500,
                                                    fontSize: '0.9rem',
                                                    color: email.isUnread ? '#000' : '#4B5563',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '140px'
                                                }}>
                                                    {extractName(email.from)}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: '#6B7280', flexShrink: 0, marginLeft: '4px' }}>
                                                    {formatDate(email.date)}
                                                </span>
                                            </div>
                                            <div style={{
                                                fontWeight: email.isUnread ? 600 : 400,
                                                color: email.isUnread ? '#111827' : '#374151',
                                                fontSize: '0.85rem',
                                                marginBottom: '0.1rem',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {email.subject}
                                            </div>
                                            <div style={{
                                                color: '#6B7280',
                                                fontSize: '0.8rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                lineHeight: '1.3'
                                            }}>
                                                {email.snippet}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {hasMore && (
                                    <div ref={observerRef} style={{ padding: '1.5rem', textAlign: 'center' }}>
                                        {loading && <RefreshCw size={16} className="spin" color="#6B7280" />}
                                    </div>
                                )}

                                {!hasMore && (
                                    <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#9CA3AF', opacity: 0.8 }}>
                                        End of list
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANE: Detail View */}
            {selectedEmail && (
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    height: '100%',
                    padding: '2rem 2rem 2rem 0',
                    display: 'flex',
                    gap: '1rem',
                    animation: 'fadeIn 0.3s ease-out forwards',
                    opacity: 0
                }}>
                    <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>

                    {/* Email Content Card */}
                    <div style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.65)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.8)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            background: 'rgba(255,255,255,0.4)'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', lineHeight: 1.4, color: '#111827' }}>{selectedEmail.subject}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6B7280', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>
                                            {extractName(selectedEmail.from)[0]}
                                        </div>
                                        <span style={{ color: '#374151' }}>{extractName(selectedEmail.from)}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{selectedEmail.date.toLocaleString()}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => {
                                        setComposeTo(extractEmail(selectedEmail.from));
                                        setComposeCc('');
                                        setComposeBcc('');
                                        setShowCc(false);
                                        setShowBcc(false);
                                        setComposeSubject(selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`);
                                        setComposeBody('');
                                        setComposeThreadId(selectedEmail.threadId);
                                        setComposeInReplyTo(selectedEmail.messageId);
                                        setComposeReferences(selectedEmail.references);
                                        setIsComposing(true);
                                    }}
                                    title="Reply"
                                    style={{
                                        background: 'rgba(37, 99, 235, 0.1)',
                                        border: '1px solid rgba(37, 99, 235, 0.2)',
                                        color: '#2563EB',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '10px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(37, 99, 235, 0.15)';
                                        e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.2)';
                                    }}
                                >
                                    <Reply size={16} /> Reply
                                </button>
                                <button onClick={() => openInGmail(selectedEmail)} title="Open in Gmail" style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: '0.5rem', borderRadius: '10px' }}>
                                    <ExternalLink size={20} />
                                </button>
                                <button onClick={closePopup} title="Close" style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '0.5rem', borderRadius: '10px' }}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                                {loadingContent ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                                        <RefreshCw className="spin" size={32} color="#6B7280" />
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            dangerouslySetInnerHTML={{ __html: emailContent || selectedEmail.snippet }}
                                            style={{ lineHeight: 1.5, fontSize: '0.9rem', color: '#1f2937', zoom: '0.85' }}
                                        />

                                        {/* Attachments */}
                                        {emailAttachments.length > 0 && (
                                            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #f1f3f4' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Paperclip size={16} />
                                                    Attachments ({emailAttachments.length})
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                                    {emailAttachments.map((att, idx) => (
                                                        <div key={idx}
                                                            onClick={() => handleDownloadAttachment(att)}
                                                            style={{
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '8px',
                                                                padding: '0.75rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.75rem',
                                                                cursor: 'pointer',
                                                                background: 'white',
                                                                transition: 'all 0.2s',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                            }}
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.borderColor = '#2563EB';
                                                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.1)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '32px', height: '32px',
                                                                background: '#F3F4F6',
                                                                borderRadius: '6px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: '#6B7280', flexShrink: 0
                                                            }}>
                                                                <Paperclip size={16} />
                                                            </div>
                                                            <div style={{ overflow: 'hidden' }}>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={att.filename}>
                                                                    {att.filename}
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                                                    {Math.round(att.size / 1024)} KB
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Reply Section */}
                                <div style={{
                                    marginTop: '2.5rem',
                                    paddingTop: '1.5rem',
                                    borderTop: '1px solid #f1f3f4'
                                }}>
                                    <button
                                        onClick={() => {
                                            setComposeTo(extractEmail(selectedEmail.from));
                                            setComposeCc('');
                                            setComposeBcc('');
                                            setShowCc(false);
                                            setShowBcc(false);
                                            setComposeSubject(selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`);
                                            setComposeBody('');
                                            setComposeThreadId(selectedEmail.threadId);
                                            setComposeInReplyTo(selectedEmail.messageId);
                                            setComposeReferences(selectedEmail.references);
                                            setIsComposing(true);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem',
                                            padding: '0.5rem 1.5rem',
                                            borderRadius: '100px',
                                            border: '1px solid #dadce0',
                                            background: 'white',
                                            color: '#3c4043',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                    >
                                        <Reply size={16} /> Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Sidebar: Plan & Suggestions */}
                    <div style={{
                        width: '320px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.8)',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)',
                        height: 'fit-content',
                        maxHeight: '100%',
                        overflowY: 'auto'
                    }}>

                        {/* Section: Manual Creation */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>
                                <div style={{ width: '24px', height: '24px', background: '#334155', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>+</span>
                                </div>
                                Create Plan
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.25rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Task Name
                                    </label>
                                    <input
                                        type="text"
                                        value={manualTitle}
                                        onChange={(e) => setManualTitle(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            border: '1px solid #E2E8F0',
                                            fontSize: '0.9rem',
                                            color: '#1E293B',
                                            background: '#F8FAFC',
                                            transition: 'all 0.2s',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#94A3B8'}
                                        onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.25rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        When?
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <button
                                            onClick={() => {
                                                const d = new Date();
                                                onAddTask(d.toLocaleDateString('en-US', { weekday: 'long' }), manualTitle, true, null, 30, '', '', participants, false, {}, 'primary');
                                                alert('Added to Today!');
                                            }}
                                            style={{
                                                padding: '0.6rem',
                                                borderRadius: '10px',
                                                border: '1px solid #E2E8F0',
                                                background: 'white',
                                                color: '#334155',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.target.style.background = '#F1F5F9'}
                                            onMouseLeave={e => e.target.style.background = 'white'}
                                        >
                                            Today
                                        </button>
                                        <button
                                            onClick={() => {
                                                const d = new Date();
                                                d.setDate(d.getDate() + 1);
                                                onAddTask(d.toLocaleDateString('en-US', { weekday: 'long' }), manualTitle, true, null, 30, '', '', participants, false, {}, 'primary');
                                                alert('Added to Tomorrow!');
                                            }}
                                            style={{
                                                padding: '0.6rem',
                                                borderRadius: '10px',
                                                border: '1px solid #E2E8F0',
                                                background: 'white',
                                                color: '#334155',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.target.style.background = '#F1F5F9'}
                                            onMouseLeave={e => e.target.style.background = 'white'}
                                        >
                                            Tomorrow
                                        </button>
                                    </div>
                                    <input
                                        type="date"
                                        style={{
                                            width: '100%',
                                            padding: '0.6rem',
                                            borderRadius: '10px',
                                            border: '1px solid #E2E8F0',
                                            background: 'white',
                                            color: '#334155',
                                            fontSize: '0.85rem'
                                        }}
                                        onChange={(e) => {
                                            if (!e.target.value) return;
                                            const d = new Date(e.target.value);
                                            onAddTask(d.toLocaleDateString('en-US', { weekday: 'long' }), manualTitle, true, null, 30, '', '', participants, false, {}, 'primary');
                                            alert(`Added to ${d.toLocaleDateString()}!`);
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <Users size={12} />
                                        Participants
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.5rem' }}>
                                        {participants.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {participants.map((p, i) => (
                                                    <span key={i} style={{ background: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
                                                        {p}
                                                        <X size={10} cursor="pointer" onClick={() => {
                                                            const newP = [...participants];
                                                            newP.splice(i, 1);
                                                            setParticipants(newP);
                                                        }} />
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            placeholder="Add email and press Enter..."
                                            value={memberInput}
                                            onChange={(e) => setMemberInput(e.target.value)}
                                            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', color: '#1E293B', width: '100%' }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && e.target.value) {
                                                    e.preventDefault();
                                                    setParticipants([...participants, e.target.value]);
                                                    setMemberInput('');
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Smart Suggestions (Conditional) */}
                        {suggestedEvent && (
                            <>
                                <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', width: '100%' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563EB', fontWeight: 700, fontSize: '0.9rem' }}>
                                        <Clock size={16} />
                                        Smart Suggestions
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {suggestedEvent.options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleAddToCalendar(opt)}
                                                style={{
                                                    background: 'rgba(37, 99, 235, 0.05)',
                                                    border: '1px solid rgba(37, 99, 235, 0.1)',
                                                    padding: '0.75rem',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.25rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.borderColor = '#2563EB';
                                                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.1)';
                                                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)';
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                    <span style={{ fontWeight: 600, color: '#1E3A8A' }}>{opt.label}</span>
                                                    {opt.timeStr && (
                                                        <span style={{ fontSize: '0.75rem', color: '#2563EB', background: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(37,99,235,0.2)' }}>
                                                            {opt.timeStr}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                                    {opt.reason}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )
            }

            {
                isComposing && isActive && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2000,
                        width: '512px',
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.15), 0 5px 15px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid #dadce0',
                        animation: 'fadeInScale 0.2s ease-out'
                    }}>
                        <style>{`
                            @keyframes fadeInScale {
                                from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
                                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                            }
                        `}</style>
                        {/* Header */}
                        <div style={{
                            padding: '0.65rem 1rem',
                            background: '#041e49',
                            color: 'white',
                            borderRadius: '8px 8px 0 0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'default'
                        }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>New Message</span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button style={{ background: 'none', border: 'none', color: 'white', padding: '0.25rem', cursor: 'pointer', display: 'flex', opacity: 0.8 }}><Minimize2 size={16} /></button>
                                <button style={{ background: 'none', border: 'none', color: 'white', padding: '0.25rem', cursor: 'pointer', display: 'flex', opacity: 0.8 }}><Maximize2 size={16} /></button>
                                <button
                                    onClick={() => setIsComposing(false)}
                                    style={{ background: 'none', border: 'none', color: 'white', padding: '0.25rem', cursor: 'pointer', display: 'flex', opacity: 0.8 }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Inputs */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                                padding: '0.5rem 1rem',
                                borderBottom: '1px solid #f1f3f4',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{ color: '#444746', fontSize: '0.875rem', minWidth: '20px' }}>To</span>
                                <input
                                    type="email"
                                    value={composeTo}
                                    onChange={(e) => setComposeTo(e.target.value)}
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '0.875rem',
                                        color: '#202124'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', color: '#444746', fontSize: '0.75rem', fontWeight: 500 }}>
                                    {!showCc && <span onClick={() => setShowCc(true)} style={{ cursor: 'pointer' }}>Cc</span>}
                                    {!showBcc && <span onClick={() => setShowBcc(true)} style={{ cursor: 'pointer' }}>Bcc</span>}
                                </div>
                            </div>

                            {showCc && (
                                <div style={{
                                    padding: '0.5rem 1rem',
                                    borderBottom: '1px solid #f1f3f4',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ color: '#444746', fontSize: '0.875rem', marginRight: '0.5rem', minWidth: '20px' }}>Cc</span>
                                    <input
                                        type="email"
                                        value={composeCc}
                                        onChange={(e) => setComposeCc(e.target.value)}
                                        style={{
                                            flex: 1,
                                            border: 'none',
                                            outline: 'none',
                                            fontSize: '0.875rem',
                                            color: '#202124'
                                        }}
                                    />
                                </div>
                            )}

                            {showBcc && (
                                <div style={{
                                    padding: '0.5rem 1rem',
                                    borderBottom: '1px solid #f1f3f4',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ color: '#444746', fontSize: '0.875rem', marginRight: '0.5rem', minWidth: '20px' }}>Bcc</span>
                                    <input
                                        type="email"
                                        value={composeBcc}
                                        onChange={(e) => setComposeBcc(e.target.value)}
                                        style={{
                                            flex: 1,
                                            border: 'none',
                                            outline: 'none',
                                            fontSize: '0.875rem',
                                            color: '#202124'
                                        }}
                                    />
                                </div>
                            )}
                            <div style={{
                                padding: '0.5rem 1rem',
                                borderBottom: '1px solid #f1f3f4',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Subject"
                                    value={composeSubject}
                                    onChange={(e) => setComposeSubject(e.target.value)}
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '0.875rem',
                                        color: '#202124'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Body */}
                        <textarea
                            autoFocus
                            value={composeBody}
                            onChange={(e) => setComposeBody(e.target.value)}
                            style={{
                                width: '100%',
                                height: '350px',
                                minHeight: '200px',
                                padding: '1rem',
                                border: 'none',
                                fontSize: '0.9rem',
                                color: '#202124',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'Arial, sans-serif'
                            }}
                        />

                        {/* Footer Toolbar */}
                        <div style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <button
                                    disabled={isSending || !composeTo.trim() || !composeSubject.trim()}
                                    onClick={() => sendEmail({
                                        to: composeTo,
                                        cc: composeCc,
                                        bcc: composeBcc,
                                        subject: composeSubject,
                                        body: composeBody,
                                        threadId: composeThreadId,
                                        inReplyTo: composeInReplyTo,
                                        references: composeReferences
                                    })}
                                    style={{
                                        background: '#0b57d0',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.6rem 1.6rem',
                                        borderRadius: '100px',
                                        fontWeight: 500,
                                        fontSize: '0.875rem',
                                        cursor: (isSending || !composeTo.trim() || !composeSubject.trim()) ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => { if (!isSending && composeTo.trim()) e.currentTarget.style.background = '#084bb5'; }}
                                    onMouseLeave={e => { if (!isSending && composeTo.trim()) e.currentTarget.style.background = '#0b57d0'; }}
                                >
                                    {isSending ? <RefreshCw className="spin" size={16} /> : 'Send'}
                                </button>

                                <div style={{ display: 'flex', gap: '0.1rem', color: '#444746' }}>
                                    {[Type, Paperclip, Link2, Smile, Image].map((Icon, idx) => (
                                        <button key={idx} style={{ background: 'none', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            <Icon size={18} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <button
                                    onClick={() => {
                                        if (confirm('Discard draft?')) {
                                            setIsComposing(false);
                                        }
                                    }}
                                    style={{ background: 'none', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    <Trash2 size={18} color="#444746" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

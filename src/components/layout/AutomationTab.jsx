import React, { useState } from 'react';
import { Bot, Save, CloudSun, Mail, Calendar as CalendarIcon } from 'lucide-react';

export default function AutomationTab() {
    const [triggerSource, setTriggerSource] = useState('');
    const [triggerTiming, setTriggerTiming] = useState('every');
    const [customDays, setCustomDays] = useState(1);
    const [weatherCondition, setWeatherCondition] = useState('');
    const [emailMatchType, setEmailMatchType] = useState('both'); // 'sender', 'subject', 'both'
    const [emailSender, setEmailSender] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [calendarEventName, setCalendarEventName] = useState('');
    const [autoTaskTitle, setAutoTaskTitle] = useState('');
    const [autoTaskNotes, setAutoTaskNotes] = useState('');
    const [actionType, setActionType] = useState('task'); // 'task' or 'plan'

    // Task specific
    const [autoTaskPriority, setAutoTaskPriority] = useState('Medium');

    // Plan specific
    const [planTime, setPlanTime] = useState('09:00');
    const [planDuration, setPlanDuration] = useState(30);
    const [planLocation, setPlanLocation] = useState('');
    const [planParticipants, setPlanParticipants] = useState('');
    const [planAddMeet, setPlanAddMeet] = useState(false);
    const [planColor, setPlanColor] = useState('#3b82f6');

    const handleSave = () => {
        const payload = {
            source: triggerSource,
            target_date_logic: triggerTiming,
            specific_date: customDays,
            condition_data: {
                weather_val: weatherCondition,
                email_match_type: emailMatchType,
                email_sender_val: emailMatchType === 'sender' || emailMatchType === 'both' ? emailSender : '',
                email_subj_val: emailMatchType === 'subject' || emailMatchType === 'both' ? emailSubject : '',
                cal_event_val: calendarEventName
            },
            task_to_create: actionType === 'task' ? {
                title: autoTaskTitle,
                notes: autoTaskNotes,
                priority: autoTaskPriority,
                date_assignment: "match_trigger_timing"
            } : null,
            plan_to_create: actionType === 'plan' ? {
                title: autoTaskTitle,
                description: autoTaskNotes,
                time: planTime,
                duration: planDuration,
                location: planLocation,
                participants: planParticipants.split(',').map(p => p.trim()).filter(Boolean),
                add_meet: planAddMeet,
                color: planColor,
                date_assignment: "match_trigger_timing"
            } : null
        };
        console.log('Saved Automation Payload:', payload);
        alert('Automation Rule Saved!');
    };

    return (
        <div style={{ height: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', color: 'var(--text-main)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexShrink: 0 }}>
                <div style={{ padding: '0.75rem', background: 'var(--primary)', color: 'white', borderRadius: '12px' }}>
                    <Bot size={24} />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Create New Automation Rule</h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
                        Set up rules to automatically create tasks or plans based on weather, emails, or calendar events.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', paddingBottom: '4rem' }}>
                {/* Step 1 */}
                <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>1. Choose Your Trigger Source</h3>
                    <p style={{ margin: '0 0 1rem 0', opacity: 0.6, fontSize: '0.85rem' }}>Which app should we watch to trigger this automation?</p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {[
                            { id: 'weather', label: <><CloudSun size={18} /> Weather</> },
                            { id: 'email', label: <><Mail size={18} /> Email</> },
                            { id: 'calendar', label: <><CalendarIcon size={18} /> Calendar</> }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setTriggerSource(opt.id)}
                                style={{
                                    flex: 1, padding: '1rem', borderRadius: '12px', border: `2px solid ${triggerSource === opt.id ? 'var(--primary)' : 'var(--border-light)'}`,
                                    background: triggerSource === opt.id ? 'var(--glass-bg)' : 'var(--input-bg)',
                                    color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600,
                                    minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2 */}
                <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>2. When should we check?</h3>
                    <p style={{ margin: '0 0 1rem 0', opacity: 0.6, fontSize: '0.85rem' }}>Select the interval or specific timing for this condition.</p>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                        {[
                            { id: 'every', label: 'Check every...' },
                            { id: 'once', label: 'Only once at...' }
                        ].map(opt => (
                            <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                                <input
                                    type="radio"
                                    name="timing"
                                    checked={triggerTiming === opt.id}
                                    onChange={() => setTriggerTiming(opt.id)}
                                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                            {triggerTiming === 'every' ? 'Number of days' : 'Number of days from now'}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="number"
                                min="1"
                                value={customDays}
                                onChange={e => setCustomDays(parseInt(e.target.value) || 1)}
                                style={{
                                    padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                    background: 'var(--input-bg)', color: 'var(--text-main)', width: '120px'
                                }}
                            />
                            <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>days</span>
                        </div>
                    </div>
                </div>

                {/* Step 3 */}
                {triggerSource && (
                    <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>3. What is the condition?</h3>
                        <p style={{ margin: '0 0 1rem 0', opacity: 0.6, fontSize: '0.85rem' }}>Define what exactly needs to happen to trigger your task.</p>

                        {triggerSource === 'weather' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>If the weather is...</label>
                                <select
                                    value={weatherCondition}
                                    onChange={e => setWeatherCondition(e.target.value)}
                                    style={{
                                        padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                        background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%', maxWidth: '300px'
                                    }}
                                >
                                    <option value="" disabled>Select weather condition...</option>
                                    <option value="Rainy">Rainy</option>
                                    <option value="Sunny">Sunny</option>
                                    <option value="Cloudy">Cloudy</option>
                                    <option value="Snowing">Snowing</option>
                                </select>
                            </div>
                        )}

                        {triggerSource === 'email' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    {[
                                        { id: 'sender', label: 'By Sender' },
                                        { id: 'subject', label: 'By Subject' },
                                        { id: 'both', label: 'Both (Sender & Subject)' }
                                    ].map(type => (
                                        <label key={type.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input
                                                type="radio"
                                                name="emailMatch"
                                                checked={emailMatchType === type.id}
                                                onChange={() => setEmailMatchType(type.id)}
                                                style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                                            />
                                            {type.label}
                                        </label>
                                    ))}
                                </div>

                                {(emailMatchType === 'sender' || emailMatchType === 'both') && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>If I get an email from (Sender Email):</label>
                                        <input
                                            type="text"
                                            value={emailSender}
                                            onChange={e => setEmailSender(e.target.value)}
                                            placeholder="e.g. boss@company.com"
                                            style={{
                                                padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                                background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%'
                                            }}
                                        />
                                    </div>
                                )}
                                {(emailMatchType === 'subject' || emailMatchType === 'both') && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                            {emailMatchType === 'both' ? 'And the subject contains:' : 'If the subject contains:'}
                                        </label>
                                        <input
                                            type="text"
                                            value={emailSubject}
                                            onChange={e => setEmailSubject(e.target.value)}
                                            placeholder="e.g. Urgent, Report"
                                            style={{
                                                padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                                background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {triggerSource === 'calendar' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>If a plan/event is scheduled named:</label>
                                <input
                                    type="text"
                                    value={calendarEventName}
                                    onChange={e => setCalendarEventName(e.target.value)}
                                    placeholder="e.g. Team Meeting"
                                    style={{
                                        padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                        background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4 */}
                <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>4. What should we auto-add?</h3>
                    <p style={{ margin: '0 0 1rem 0', opacity: 0.6, fontSize: '0.85rem' }}>This item will be added to the day determined by Step 2.</p>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { id: 'task', label: 'Create a Task' },
                            { id: 'plan', label: 'Schedule a Plan / Event' }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setActionType(type.id)}
                                style={{
                                    flex: 1, padding: '0.75rem', borderRadius: '12px', border: `2px solid ${actionType === type.id ? 'var(--primary)' : 'var(--border-light)'}`,
                                    background: actionType === type.id ? 'var(--glass-bg)' : 'var(--input-bg)',
                                    color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600,
                                }}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                {actionType === 'task' ? 'Task Name' : 'Plan/Event Title'}
                            </label>
                            <input
                                type="text"
                                value={autoTaskTitle}
                                onChange={e => setAutoTaskTitle(e.target.value)}
                                placeholder={actionType === 'task' ? "e.g. Bring an umbrella" : "e.g. Team Planning Session"}
                                style={{
                                    padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                    background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                {actionType === 'task' ? 'Task Notes (Optional)' : 'Description (Optional)'}
                            </label>
                            <textarea
                                value={autoTaskNotes}
                                onChange={e => setAutoTaskNotes(e.target.value)}
                                placeholder="Any extra details..."
                                rows={3}
                                style={{
                                    padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                    background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%', resize: 'vertical'
                                }}
                            />
                        </div>

                        {actionType === 'task' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Priority</label>
                                <select
                                    value={autoTaskPriority}
                                    onChange={e => setAutoTaskPriority(e.target.value)}
                                    style={{
                                        padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                        background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%', maxWidth: '200px'
                                    }}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        )}

                        {actionType === 'plan' && (
                            <>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Start Time</label>
                                        <input
                                            type="time"
                                            value={planTime}
                                            onChange={e => setPlanTime(e.target.value)}
                                            style={{
                                                padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                                background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%'
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Duration (mins)</label>
                                        <input
                                            type="number"
                                            min="5" step="5"
                                            value={planDuration}
                                            onChange={e => setPlanDuration(parseInt(e.target.value) || 30)}
                                            style={{
                                                padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                                background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Location (Optional)</label>
                                    <input
                                        type="text"
                                        value={planLocation}
                                        onChange={e => setPlanLocation(e.target.value)}
                                        placeholder="Add location"
                                        style={{
                                            padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                            background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Participants (Optional, comma separated emails)</label>
                                    <input
                                        type="text"
                                        value={planParticipants}
                                        onChange={e => setPlanParticipants(e.target.value)}
                                        placeholder="e.g. colleague@company.com"
                                        style={{
                                            padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                                            background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                                        <input
                                            type="checkbox"
                                            checked={planAddMeet}
                                            onChange={e => setPlanAddMeet(e.target.checked)}
                                            style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                                        />
                                        Add Google Meet link
                                    </label>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Color</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(color => (
                                                <div
                                                    key={color}
                                                    onClick={() => setPlanColor(color)}
                                                    style={{
                                                        width: '24px', height: '24px', borderRadius: '50%', backgroundColor: color,
                                                        cursor: 'pointer', border: planColor === color ? '2px solid var(--text-main)' : '2px solid transparent',
                                                        boxShadow: planColor === color ? '0 0 0 2px var(--bg-main)' : 'none'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Step 5 */}
                <button
                    onClick={handleSave}
                    disabled={!triggerSource || !autoTaskTitle}
                    style={{
                        padding: '1rem 2rem',
                        borderRadius: '12px',
                        background: (!triggerSource || !autoTaskTitle) ? 'var(--border-light)' : 'var(--primary)',
                        color: (!triggerSource || !autoTaskTitle) ? 'var(--text-muted)' : 'white',
                        border: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        cursor: (!triggerSource || !autoTaskTitle) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        marginTop: '0.5rem',
                        boxShadow: (!triggerSource || !autoTaskTitle) ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.2)'
                    }}
                >
                    <Save size={20} />
                    Save Automation Rule
                </button>
            </div>
        </div>
    );
}

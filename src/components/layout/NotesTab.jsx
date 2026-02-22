import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Plus, Trash2, FileText, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotesTab() {
    const [notes, setNotes] = useLocalStorage('prohub-global-notes', []);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [activeGroup, setActiveGroup] = useState('All');
    const [dragOverNodeId, setDragOverNodeId] = useState(null);

    // Provide default empty state
    useEffect(() => {
        if (notes.length === 0) {
            const initialNote = { id: Date.now().toString(), title: 'Untitled Note', content: '', group: 'General', updatedAt: Date.now() };
            setNotes([initialNote]);
            setActiveNoteId(initialNote.id);
        } else if (!activeNoteId) {
            setActiveNoteId(notes[0].id);
        }
    }, [notes, activeNoteId, setNotes]);

    const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

    const uniqueGroups = Array.from(new Set(notes.map(n => n.group || 'General')));
    const groups = ['All', ...uniqueGroups];

    const filteredNotes = activeGroup === 'All'
        ? notes
        : notes.filter(n => (n.group || 'General') === activeGroup);

    const createNote = () => {
        const defaultGroup = activeGroup === 'All' ? 'General' : activeGroup;
        const newNote = { id: Date.now().toString(), title: 'Untitled Note', content: '', group: defaultGroup, updatedAt: Date.now() };
        setNotes([newNote, ...notes]);
        setActiveNoteId(newNote.id);
    };

    const deleteNote = (id) => {
        const newNotes = notes.filter(n => n.id !== id);
        setNotes(newNotes);
        if (activeNoteId === id) {
            const nextFiltered = newNotes.filter(n => activeGroup === 'All' || (n.group || 'General') === activeGroup);
            setActiveNoteId(nextFiltered.length > 0 ? nextFiltered[0].id : (newNotes.length > 0 ? newNotes[0].id : null));
        }
    };

    const updateActiveNote = (updates) => {
        if (!activeNoteId) return;
        setNotes(notes.map(n => n.id === activeNoteId ? { ...n, ...updates, updatedAt: Date.now() } : n));
        if (updates.group && activeGroup !== 'All' && updates.group !== activeGroup) {
            setActiveGroup(updates.group);
        }
    };

    if (!activeNote) return null;

    return (
        <div style={{ flex: 1, display: 'flex', gap: '1rem', height: '100%', width: '100%', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div className="glass-card static" style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.9)' }}>
                <div style={{ padding: '0 0 1rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <Folder size={20} color="var(--primary)" />
                        <select
                            value={activeGroup}
                            onChange={(e) => setActiveGroup(e.target.value)}
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: 500,
                                color: 'var(--text-main)',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                flex: 1,
                                width: '100%',
                                appearance: 'none'
                            }}
                        >
                            {groups.map(g => (
                                <option key={g} value={g}>{g === 'All' ? 'All Notes' : g}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={createNote}
                        style={{
                            background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%',
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <AnimatePresence>
                        {filteredNotes.map(note => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', note.id);
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOverNodeId(note.id);
                                }}
                                onDragLeave={() => {
                                    setDragOverNodeId(null);
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragOverNodeId(null);
                                    const draggedId = e.dataTransfer.getData('text/plain');
                                    if (draggedId && draggedId !== note.id) {
                                        let targetGroup = note.group || 'General';
                                        if (targetGroup === 'General') {
                                            targetGroup = 'New Group';
                                            setNotes(prev => prev.map(n => {
                                                if (n.id === note.id || n.id === draggedId) {
                                                    return { ...n, group: targetGroup, updatedAt: Date.now() };
                                                }
                                                return n;
                                            }));
                                        } else {
                                            setNotes(prev => prev.map(n => {
                                                if (n.id === draggedId) {
                                                    return { ...n, group: targetGroup, updatedAt: Date.now() };
                                                }
                                                return n;
                                            }));
                                        }
                                    }
                                }}
                                onClick={() => setActiveNoteId(note.id)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    background: activeNoteId === note.id ? 'var(--primary)' : 'rgba(0,0,0,0.02)',
                                    color: activeNoteId === note.id ? 'white' : 'var(--text-main)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    border: dragOverNodeId === note.id ? '2px dashed var(--primary)' : '2px solid transparent'
                                }}
                            >
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: '0.5rem', fontWeight: activeNoteId === note.id ? 600 : 400 }}>
                                    {note.title || 'Untitled Note'}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                    style={{
                                        background: 'none', border: 'none', color: activeNoteId === note.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                                        cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Main Editor */}
            <div className="glass-card static" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.95)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', opacity: 0.7 }}>
                    <Folder size={14} />
                    <input
                        value={activeNote.group || 'General'}
                        onChange={(e) => updateActiveNote({ group: e.target.value })}
                        placeholder="Group Name"
                        style={{
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: '0.9rem',
                            color: 'var(--text-main)',
                            fontWeight: 500,
                            padding: 0
                        }}
                    />
                </div>
                <input
                    value={activeNote.title}
                    onChange={(e) => updateActiveNote({ title: e.target.value })}
                    placeholder="Note Title"
                    style={{
                        fontSize: '2rem',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        padding: '1rem 0',
                        marginBottom: '1rem',
                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                    }}
                />
                <textarea
                    value={activeNote.content}
                    onChange={(e) => updateActiveNote({ content: e.target.value })}
                    placeholder="Start typing your note here..."
                    style={{
                        flex: 1,
                        width: '100%',
                        resize: 'none',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '1.05rem',
                        lineHeight: '1.6',
                        color: 'var(--text-main)',
                        fontFamily: 'inherit'
                    }}
                />
            </div>
        </div>
    );
}

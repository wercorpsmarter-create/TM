import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Plus, Trash2, FileText, Folder, FolderPlus, ChevronRight, ChevronDown, MoreHorizontal, Search, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to group notes by time period
function groupNotesByTime(notes) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {};

    notes.forEach(note => {
        const noteDate = new Date(note.updatedAt);
        let groupLabel;

        if (noteDate >= today) {
            groupLabel = 'Today';
        } else if (noteDate >= sevenDaysAgo) {
            groupLabel = 'Previous 7 Days';
        } else if (noteDate >= thirtyDaysAgo) {
            groupLabel = 'Previous 30 Days';
        } else {
            // Group by month name
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            groupLabel = monthNames[noteDate.getMonth()];
        }

        if (!groups[groupLabel]) groups[groupLabel] = [];
        groups[groupLabel].push(note);
    });

    // Sort within each group
    Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => b.updatedAt - a.updatedAt);
    });

    // Return in order
    const order = ['Today', 'Previous 7 Days', 'Previous 30 Days',
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const sorted = [];
    order.forEach(label => {
        if (groups[label]) {
            sorted.push({ label, notes: groups[label] });
        }
    });
    return sorted;
}

function formatNoteDate(timestamp) {
    const d = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (d >= today) {
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
}

export default function NotesTab() {
    const [notes, setNotes] = useLocalStorage('prohub-global-notes', []);
    const [folders, setFolders] = useLocalStorage('prohub-note-folders', [
        { id: 'all', name: 'All Notes', icon: 'notes', system: true },
        { id: 'general', name: 'General', icon: 'folder' },
    ]);
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [activeFolderId, setActiveFolderId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingFolderId, setEditingFolderId] = useState(null);
    const [editingFolderName, setEditingFolderName] = useState('');
    const [expandedFolders, setExpandedFolders] = useState({});
    const folderInputRef = useRef(null);

    // Initialize with a default note
    useEffect(() => {
        if (notes.length === 0) {
            const initialNote = {
                id: Date.now().toString(),
                title: 'Welcome',
                content: 'Start taking notes here...',
                folderId: 'general',
                updatedAt: Date.now()
            };
            setNotes([initialNote]);
            setActiveNoteId(initialNote.id);
        } else if (!activeNoteId) {
            setActiveNoteId(notes[0].id);
        }
    }, [notes, activeNoteId, setNotes]);

    const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

    // Filtered notes based on active folder and search
    const filteredNotes = notes.filter(n => {
        const matchesFolder = activeFolderId === 'all' || (n.folderId || 'general') === activeFolderId;
        const matchesSearch = !searchQuery ||
            (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (n.content || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFolder && matchesSearch;
    }).sort((a, b) => b.updatedAt - a.updatedAt);

    const timeGroups = groupNotesByTime(filteredNotes);

    const createNote = () => {
        const targetFolder = activeFolderId === 'all' ? 'general' : activeFolderId;
        const newNote = {
            id: Date.now().toString(),
            title: '',
            content: '',
            folderId: targetFolder,
            updatedAt: Date.now()
        };
        setNotes([newNote, ...notes]);
        setActiveNoteId(newNote.id);
    };

    const deleteNote = (id, e) => {
        if (e) e.stopPropagation();
        const newNotes = notes.filter(n => n.id !== id);
        setNotes(newNotes);
        if (activeNoteId === id) {
            const remaining = newNotes.filter(n =>
                activeFolderId === 'all' || (n.folderId || 'general') === activeFolderId
            );
            setActiveNoteId(remaining.length > 0 ? remaining[0].id : (newNotes.length > 0 ? newNotes[0].id : null));
        }
    };

    const updateActiveNote = (updates) => {
        if (!activeNoteId) return;
        setNotes(notes.map(n =>
            n.id === activeNoteId ? { ...n, ...updates, updatedAt: Date.now() } : n
        ));
    };

    const createFolder = () => {
        const newFolder = {
            id: Date.now().toString(),
            name: 'New Folder',
            icon: 'folder'
        };
        setFolders([...folders, newFolder]);
        setEditingFolderId(newFolder.id);
        setEditingFolderName('New Folder');
        setActiveFolderId(newFolder.id);
    };

    const renameFolder = (folderId, name) => {
        if (!name.trim()) return;
        setFolders(folders.map(f =>
            f.id === folderId ? { ...f, name: name.trim() } : f
        ));
        setEditingFolderId(null);
    };

    const deleteFolder = (folderId) => {
        // Move all notes in this folder to 'general'
        setNotes(notes.map(n =>
            (n.folderId || 'general') === folderId ? { ...n, folderId: 'general' } : n
        ));
        setFolders(folders.filter(f => f.id !== folderId));
        if (activeFolderId === folderId) setActiveFolderId('all');
    };

    const folderNoteCounts = {};
    notes.forEach(n => {
        const fid = n.folderId || 'general';
        folderNoteCounts[fid] = (folderNoteCounts[fid] || 0) + 1;
    });
    folderNoteCounts['all'] = notes.length;

    const activeFolder = folders.find(f => f.id === activeFolderId) || folders[0];

    if (!activeNote && notes.length === 0) return null;

    return (
        <div style={{ flex: 1, display: 'flex', height: '100%', width: '100%', overflow: 'hidden', gap: 0 }}>

            {/* ===== LEFT: Folder Sidebar ===== */}
            <div style={{
                width: '180px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(245, 245, 247, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '16px 0 0 16px',
                overflow: 'hidden'
            }}>
                {/* Folder Header */}
                <div style={{
                    padding: '16px 12px 8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#86868b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>Folders</span>
                    <button
                        onClick={createFolder}
                        title="New Folder"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#86868b',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                            transition: 'color 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#1d1d1f'}
                        onMouseLeave={e => e.currentTarget.style.color = '#86868b'}
                    >
                        <FolderPlus size={14} />
                    </button>
                </div>

                {/* Folder List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px 8px' }}>
                    {folders.map(folder => {
                        const isActive = activeFolderId === folder.id;
                        const isEditing = editingFolderId === folder.id;
                        const count = folderNoteCounts[folder.id] || 0;

                        return (
                            <div
                                key={folder.id}
                                onClick={() => { setActiveFolderId(folder.id); setSearchQuery(''); }}
                                onDoubleClick={() => {
                                    if (!folder.system) {
                                        setEditingFolderId(folder.id);
                                        setEditingFolderName(folder.name);
                                    }
                                }}
                                onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = 'rgba(0,122,255,0.1)'; }}
                                onDragLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(0,122,255,0.12)' : 'transparent'; }}
                                onDrop={e => {
                                    e.preventDefault();
                                    e.currentTarget.style.background = isActive ? 'rgba(0,122,255,0.12)' : 'transparent';
                                    const noteId = e.dataTransfer.getData('noteId');
                                    if (noteId && folder.id !== 'all') {
                                        setNotes(prev => prev.map(n =>
                                            n.id === noteId ? { ...n, folderId: folder.id, updatedAt: Date.now() } : n
                                        ));
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: isActive ? 'rgba(0,122,255,0.12)' : 'transparent',
                                    color: isActive ? '#007aff' : '#1d1d1f',
                                    fontSize: '0.85rem',
                                    fontWeight: isActive ? 600 : 400,
                                    transition: 'all 0.15s',
                                    marginBottom: '2px',
                                    position: 'relative'
                                }}
                            >
                                {folder.icon === 'notes' ?
                                    <FileText size={15} style={{ flexShrink: 0 }} /> :
                                    <Folder size={15} style={{ flexShrink: 0 }} />
                                }
                                {isEditing ? (
                                    <input
                                        ref={folderInputRef}
                                        autoFocus
                                        value={editingFolderName}
                                        onChange={e => setEditingFolderName(e.target.value)}
                                        onBlur={() => renameFolder(folder.id, editingFolderName)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') renameFolder(folder.id, editingFolderName);
                                            if (e.key === 'Escape') setEditingFolderId(null);
                                        }}
                                        onClick={e => e.stopPropagation()}
                                        style={{
                                            border: 'none',
                                            outline: 'none',
                                            background: 'rgba(255,255,255,0.8)',
                                            borderRadius: '4px',
                                            padding: '2px 4px',
                                            fontSize: 'inherit',
                                            color: 'inherit',
                                            fontWeight: 'inherit',
                                            flex: 1,
                                            minWidth: 0
                                        }}
                                    />
                                ) : (
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {folder.name}
                                    </span>
                                )}
                                <span style={{
                                    fontSize: '0.7rem',
                                    color: isActive ? '#007aff' : '#86868b',
                                    fontWeight: 500,
                                    minWidth: '16px',
                                    textAlign: 'right'
                                }}>
                                    {count > 0 ? count : ''}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Delete folder button at bottom */}
                {activeFolderId !== 'all' && !folders.find(f => f.id === activeFolderId)?.system && (
                    <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <button
                            onClick={() => deleteFolder(activeFolderId)}
                            style={{
                                width: '100%',
                                background: 'none',
                                border: 'none',
                                color: '#ff3b30',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '6px',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                            Delete Folder
                        </button>
                    </div>
                )}
            </div>

            {/* ===== MIDDLE: Note List ===== */}
            <div style={{
                width: '260px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden'
            }}>
                {/* List Header */}
                <div style={{ padding: '12px 12px 8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            color: '#1d1d1f',
                            letterSpacing: '-0.01em'
                        }}>
                            {activeFolder?.name || 'Notes'}
                        </h3>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={createNote}
                                title="New Note"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#007aff',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '6px'
                                }}
                            >
                                <Edit3 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.04)',
                    }}>
                        <Search size={13} color="#86868b" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search"
                            style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: '0.85rem',
                                color: '#1d1d1f',
                                flex: 1,
                                padding: 0
                            }}
                        />
                    </div>
                </div>

                {/* Note List grouped by time */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px 8px' }}>
                    {filteredNotes.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#86868b', fontSize: '0.85rem' }}>
                            No notes yet
                        </div>
                    )}
                    {timeGroups.map(group => (
                        <div key={group.label}>
                            <div style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: '#86868b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                padding: '14px 8px 6px 8px'
                            }}>
                                {group.label}
                            </div>
                            {group.notes.map(note => {
                                const isActive = activeNoteId === note.id;
                                const preview = (note.content || '').substring(0, 60).replace(/\n/g, ' ');
                                return (
                                    <motion.div
                                        key={note.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        draggable
                                        onDragStart={e => { e.dataTransfer.setData('noteId', note.id); }}
                                        onClick={() => setActiveNoteId(note.id)}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            background: isActive ? '#FFCC02' : 'transparent',
                                            marginBottom: '2px',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <div style={{
                                            fontSize: '0.88rem',
                                            fontWeight: 600,
                                            color: isActive ? '#1d1d1f' : '#1d1d1f',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            marginBottom: '2px'
                                        }}>
                                            {note.title || 'Untitled Note'}
                                        </div>
                                        <div style={{
                                            fontSize: '0.78rem',
                                            color: isActive ? 'rgba(0,0,0,0.7)' : '#86868b',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            display: 'flex',
                                            gap: '8px',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ fontWeight: 500 }}>{formatNoteDate(note.updatedAt)}</span>
                                            <span style={{ opacity: 0.8 }}>{preview || 'No additional text'}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== RIGHT: Note Editor ===== */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255,255,255,0.98)',
                borderRadius: '0 16px 16px 0',
                overflow: 'hidden',
                minWidth: 0
            }}>
                {activeNote ? (
                    <>
                        {/* Editor Toolbar */}
                        <div style={{
                            padding: '10px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Folder size={13} color="#86868b" />
                                <select
                                    value={activeNote.folderId || 'general'}
                                    onChange={e => updateActiveNote({ folderId: e.target.value })}
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        fontSize: '0.8rem',
                                        color: '#86868b',
                                        cursor: 'pointer',
                                        padding: 0,
                                        fontWeight: 500
                                    }}
                                >
                                    {folders.filter(f => f.id !== 'all').map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => deleteNote(activeNoteId)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#86868b',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '6px',
                                    transition: 'color 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ff3b30'}
                                onMouseLeave={e => e.currentTarget.style.color = '#86868b'}
                                title="Delete Note"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>

                        {/* Title */}
                        <div style={{ padding: '24px 28px 0 28px' }}>
                            <input
                                value={activeNote.title}
                                onChange={e => updateActiveNote({ title: e.target.value })}
                                placeholder="Title"
                                style={{
                                    fontSize: '1.75rem',
                                    fontWeight: 700,
                                    color: '#1d1d1f',
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    padding: 0,
                                    width: '100%',
                                    letterSpacing: '-0.02em'
                                }}
                            />
                            <div style={{
                                fontSize: '0.78rem',
                                color: '#86868b',
                                marginTop: '4px',
                                paddingBottom: '16px',
                                borderBottom: '1px solid rgba(0,0,0,0.04)'
                            }}>
                                {new Date(activeNote.updatedAt).toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>

                        {/* Content */}
                        <textarea
                            value={activeNote.content}
                            onChange={e => updateActiveNote({ content: e.target.value })}
                            placeholder="Start typing your note here..."
                            style={{
                                flex: 1,
                                width: '100%',
                                resize: 'none',
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: '1rem',
                                lineHeight: '1.7',
                                color: '#1d1d1f',
                                fontFamily: 'inherit',
                                padding: '16px 28px 28px 28px'
                            }}
                        />
                    </>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#86868b',
                        fontSize: '0.95rem'
                    }}>
                        Select a note or create a new one
                    </div>
                )}
            </div>
        </div>
    );
}

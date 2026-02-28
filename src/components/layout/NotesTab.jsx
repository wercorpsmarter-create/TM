import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Plus, Trash2, FileText, Folder, FolderPlus, ChevronRight, ChevronDown, ChevronLeft, MoreHorizontal, Search, Edit3, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
    const [folderSidebarCollapsed, setFolderSidebarCollapsed] = useState(false);
    const [folderEditMode, setFolderEditMode] = useState(false);
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

            {/* ===== LEFT: Combined Sidebar (Folders & Notes) ===== */}
            <div style={{
                width: folderSidebarCollapsed ? '0px' : '280px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(245, 245, 247, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRight: folderSidebarCollapsed ? 'none' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: '16px 0 0 16px',
                overflow: 'hidden',
                transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                minWidth: 0
            }}>
                {/* Header & Controls */}
                <div style={{ padding: '16px 12px 12px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                onClick={() => setFolderSidebarCollapsed(!folderSidebarCollapsed)}
                                title={folderSidebarCollapsed ? 'Show Folders' : 'Hide Folders'}
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
                                {folderSidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
                            </button>
                            <span style={{
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                color: '#1d1d1f',
                                letterSpacing: '-0.01em'
                            }}>Notes</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button
                                onClick={() => setFolderEditMode(!folderEditMode)}
                                title={folderEditMode ? 'Done' : 'Edit Folders'}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: folderEditMode ? '#1d1d1f' : '#86868b',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    transition: 'color 0.15s'
                                }}
                            >
                                {folderEditMode ? 'Done' : 'Edit'}
                            </button>
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
                            <button
                                onClick={createNote}
                                title="New Note"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#86868b',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '6px',
                                    transition: 'color 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#1d1d1f'}
                                onMouseLeave={e => e.currentTarget.style.color = '#86868b'}
                            >
                                <Edit3 size={15} />
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
                            placeholder="Search notes"
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

                {/* Accordion Folders and Notes */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px 8px' }}>
                    {folders.filter(f => f.id !== 'all').map(folder => {
                        const isEditing = editingFolderId === folder.id;
                        const isExpanded = expandedFolders[folder.id] || searchQuery.length > 0;
                        const folderNotes = notes.filter(n => (n.folderId || 'general') === folder.id).filter(n => {
                            return !searchQuery ||
                                (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (n.content || '').toLowerCase().includes(searchQuery.toLowerCase());
                        }).sort((a, b) => b.updatedAt - a.updatedAt);

                        const count = folderNotes.length;

                        // Only show folder if it matches search or has matching notes, or if not searching.
                        if (searchQuery && count === 0 && !folder.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                            return null;
                        }

                        return (
                            <div key={folder.id} style={{ marginBottom: '4px' }}>
                                {/* Folder Header */}
                                <div
                                    onClick={() => setExpandedFolders({ ...expandedFolders, [folder.id]: !isExpanded })}
                                    onDoubleClick={() => {
                                        if (!folder.system) {
                                            setEditingFolderId(folder.id);
                                            setEditingFolderName(folder.name);
                                        }
                                    }}
                                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
                                    onDragLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.style.background = 'transparent';
                                        const noteId = e.dataTransfer.getData('noteId');
                                        if (noteId) {
                                            setNotes(prev => prev.map(n =>
                                                n.id === noteId ? { ...n, folderId: folder.id, updatedAt: Date.now() } : n
                                            ));
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 8px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: 'transparent',
                                        color: '#1d1d1f',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        transition: 'all 0.15s',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {isExpanded ? <ChevronDown size={14} color="#86868b" /> : <ChevronRight size={14} color="#86868b" />}

                                    {/* Delete button in edit mode */}
                                    {folderEditMode && !folder.system && (
                                        <button
                                            onClick={e => { e.stopPropagation(); deleteFolder(folder.id); }}
                                            title="Delete Folder"
                                            style={{
                                                background: '#ff3b30',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'white',
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                padding: 0,
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                lineHeight: 1
                                            }}
                                        >
                                            −
                                        </button>
                                    )}

                                    {folder.icon === 'notes' ?
                                        <FileText size={15} style={{ flexShrink: 0, color: '#86868b' }} /> :
                                        <Folder size={15} style={{ flexShrink: 0, color: '#86868b' }} />
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

                                    {/* Note Count */}
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: '#86868b',
                                        fontWeight: 500,
                                        textAlign: 'right',
                                        marginLeft: 'auto'
                                    }}>
                                        {folderNoteCounts[folder.id] > 0 ? folderNoteCounts[folder.id] : ''}
                                    </span>

                                    {/* Add note button */}
                                    {!isEditing && (
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setActiveFolderId(folder.id);
                                                setExpandedFolders({ ...expandedFolders, [folder.id]: true });
                                                const newNote = {
                                                    id: Date.now().toString(),
                                                    title: '',
                                                    content: '',
                                                    folderId: folder.id,
                                                    updatedAt: Date.now()
                                                };
                                                setNotes([newNote, ...notes]);
                                                setActiveNoteId(newNote.id);
                                                setSearchQuery('');
                                            }}
                                            title="Add note to this folder"
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#86868b',
                                                padding: '2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                borderRadius: '4px',
                                                transition: 'color 0.15s, background 0.15s'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.color = '#1d1d1f';
                                                e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.color = '#86868b';
                                                e.currentTarget.style.background = 'none';
                                            }}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Folders Notes (Expanded State) */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: 'hidden', paddingLeft: '22px' }}
                                        >
                                            <div style={{ paddingTop: '4px', paddingBottom: '4px' }}>
                                                {folderNotes.length === 0 && (
                                                    <div style={{ padding: '8px 12px', color: '#86868b', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                                        Empty folder
                                                    </div>
                                                )}
                                                {folderNotes.map(note => {
                                                    const isActive = activeNoteId === note.id;
                                                    const preview = (note.content || '').substring(0, 40).replace(/\n/g, ' ');
                                                    return (
                                                        <div
                                                            key={note.id}
                                                            draggable
                                                            onDragStart={e => { e.dataTransfer.setData('noteId', note.id); }}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setActiveNoteId(note.id);
                                                            }}
                                                            style={{
                                                                padding: '8px 10px',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                background: isActive ? 'rgba(0,0,0,0.06)' : 'transparent',
                                                                marginBottom: '2px',
                                                                transition: 'background 0.15s',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                position: 'relative'
                                                            }}
                                                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                                                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                marginBottom: '2px'
                                                            }}>
                                                                {/* Delete note button in edit mode */}
                                                                {folderEditMode && (
                                                                    <button
                                                                        onClick={e => { e.stopPropagation(); deleteNote(note.id, e); }}
                                                                        title="Delete Note"
                                                                        style={{
                                                                            background: '#ff3b30',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            color: 'white',
                                                                            width: '14px',
                                                                            height: '14px',
                                                                            borderRadius: '50%',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            flexShrink: 0,
                                                                            padding: 0,
                                                                            fontSize: '10px',
                                                                            fontWeight: 700,
                                                                            lineHeight: 1
                                                                        }}
                                                                    >
                                                                        −
                                                                    </button>
                                                                )}
                                                                <FileText size={12} style={{ display: 'inline', color: isActive ? '#1d1d1f' : '#86868b', flexShrink: 0 }} />
                                                                <div style={{
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: isActive ? 600 : 500,
                                                                    color: '#1d1d1f',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    flex: 1
                                                                }}>
                                                                    {note.title || 'Untitled Note'}
                                                                </div>
                                                            </div>
                                                            {preview && (
                                                                <div style={{
                                                                    fontSize: '0.7rem',
                                                                    color: isActive ? 'rgba(0,0,0,0.7)' : '#86868b',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    paddingLeft: folderEditMode ? '38px' : '18px'
                                                                }}>
                                                                    {preview}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
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

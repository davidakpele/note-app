'use client';

import React, { useState, useEffect } from 'react';
import { Note, NoteFormData } from '../types/note';

interface NoteEditorProps {
  note: Note | null;
  isCreating: boolean;
  isSaving: boolean;
  onSave: (data: NoteFormData) => void;
  onCancel: () => void;
}

export default function NoteEditor({ note, isCreating, isSaving, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isCreating) {
      setTitle('');
      setContent('');
    } else if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note, isCreating]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), content: content.trim() });
  };

  return (
    <div className="editor">
      <div className="editor__header">
        <h2 className="editor__heading">{isCreating ? 'New Note' : 'Edit Note'}</h2>
      </div>
      <div className="editor__body">
        <div className="field">
          <label className="field__label" htmlFor="note-title">Title</label>
          <input
            id="note-title"
            className="field__input"
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="note-content">Content</label>
          <textarea
            id="note-content"
            className="field__textarea"
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            disabled={isSaving}
          />
        </div>
      </div>
      <div className="editor__actions">
        <button
          className="btn btn--primary"
          onClick={handleSave}
          disabled={!title.trim() || isSaving}
        >
          {isSaving ? <SpinnerIcon /> : <SaveIcon />}
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button className="btn btn--ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function SaveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
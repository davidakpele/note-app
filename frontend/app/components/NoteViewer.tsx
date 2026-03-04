'use client';

import React from 'react';
import { Note } from '../types/note';
import { timeAgo } from '../lib/time';

interface NoteViewerProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDeleteRequest: (id: string) => void;
}

export default function NoteViewer({ note, onEdit, onDeleteRequest }: NoteViewerProps) {
  return (
    <div className="viewer">
      <div className="viewer__header">
        <div className="viewer__meta">
          <h1 className="viewer__title">{note.title}</h1>
          <span className="viewer__time">Last updated {timeAgo(note.updatedAt)}</span>
        </div>
        <div className="viewer__actions">
          <button className="btn btn--ghost btn--icon-label" onClick={() => onEdit(note)}>
            <EditIcon /> Edit
          </button>
          <button className="btn btn--danger-outline btn--icon-label" onClick={() => onDeleteRequest(note.id)}>
            <TrashIcon /> Delete
          </button>
        </div>
      </div>
      <div className="viewer__divider" />
      <div className="viewer__content">
        {note.content || <span className="viewer__empty">No content yet.</span>}
      </div>
    </div>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
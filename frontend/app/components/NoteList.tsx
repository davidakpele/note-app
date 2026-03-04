'use client';

import React from 'react';
import { Note } from '../types/note';
import { timeAgo } from '../lib/time';

interface NoteListProps {
  notes: Note[];
  selectedNote: Note | null;
  isCreating: boolean;
  isEditing: boolean;
  onSelect: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDeleteRequest: (id: string) => void;
}

export default function NoteList({
  notes,
  selectedNote,
  isCreating,
  isEditing,
  onSelect,
  onEdit,
  onDeleteRequest,
}: NoteListProps) {
  return (
    <ul className="note-list">
      {notes.length === 0 && (
        <li className="note-list__empty">No notes found</li>
      )}
      {notes.map((note) => {
        const isActive = !isCreating && selectedNote?.id === note.id;
        return (
          <li
            key={note.id}
            className={`note-item${isActive ? ' note-item--active' : ''}`}
            onClick={() => onSelect(note)}
          >
            <div className="note-item__body">
              <h3 className="note-item__title">{note.title}</h3>
              <p className="note-item__preview">{note.content}</p>
              <span className="note-item__time">{timeAgo(note.updatedAt)}</span>
            </div>
            <div className="note-item__actions">
              <button
                className="note-item__btn note-item__btn--edit"
                aria-label="Edit note"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(note);
                }}
              >
                <EditIcon />
              </button>
              <button
                className="note-item__btn note-item__btn--delete"
                aria-label="Delete note"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRequest(note.id);
                }}
              >
                <TrashIcon />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
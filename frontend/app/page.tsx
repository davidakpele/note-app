'use client';

import React from 'react';
import DeleteModal from './components/DeleteModal';
import SearchBar from './components/SearchBar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import NoteViewer from './components/NoteViewer';
import { useNotes } from './hooks/useNotes';

export default function NotesPage() {
  const {
    notes,
    selectedNote,
    isCreating,
    isEditing,
    isLoading,
    isSaving,
    error,
    deleteConfirmId,
    searchQuery,
    setSearchQuery,
    handleCreate,
    handleSelect,
    handleEdit,
    handleSave,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleCancel,
  } = useNotes();

  const showEditor = isCreating || isEditing;

  // Shared skeleton for sidebar
  const SidebarSkeleton = () => (
    <div className="skeleton-list">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line skeleton-line--preview" />
          <div className="skeleton-line skeleton-line--time" />
        </div>
      ))}
    </div>
  );

  // Shared skeleton for main panel
  const PanelSkeleton = () => (
    <div className="editor editor--loading">
      <div className="skeleton-viewer">
        <div className="skeleton-line skeleton-line--heading" />
        <div className="skeleton-line skeleton-line--subtext" />
        <div className="skeleton-divider" />
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-line--short" />
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-line--short" />
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      {deleteConfirmId && (
        <DeleteModal onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />
      )}

      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <span className="app-header__title">Notes App</span>
        </div>
        <button className="btn-create" onClick={handleCreate} disabled={isLoading || isSaving}>
          <span className="btn-create__icon">+</span> Create Note
        </button>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <ErrorIcon /> {error}
          </div>
        )}

        <aside className="sidebar">
          <div className="sidebar__top">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="sidebar__label">Notes</div>

          {isLoading ? <SidebarSkeleton /> : (
            <NoteList
              notes={notes}
              selectedNote={selectedNote}
              isCreating={isCreating}
              isEditing={isEditing}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDeleteRequest={handleDeleteRequest}
            />
          )}
        </aside>

        <section>
          {isLoading ? (
            <PanelSkeleton />
          ) : showEditor ? (
            <NoteEditor
              note={selectedNote}
              isCreating={isCreating}
              isSaving={isSaving}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : selectedNote ? (
            <NoteViewer
              note={selectedNote}
              onEdit={handleEdit}
              onDeleteRequest={handleDeleteRequest}
            />
          ) : (
            <div className="editor editor--empty">
              <div className="editor__empty-state">
                <NoteEmptyIcon />
                <p>Select a note or create a new one</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">© {new Date().getFullYear()} Notes App</footer>
    </div>
  );
}

function NoteEmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
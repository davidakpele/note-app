'use client';

import { useState, useEffect, useCallback } from 'react';
import { Note, NoteFormData } from '../types/note';
import * as api from '../lib/api';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadNotes = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const [data] = await Promise.all([api.fetchNotes(), delay(2000)]);
      setNotes(data);
      return data;
    } catch {
      setError('Could not load notes. Is the server running?');
      return null;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const filteredNotes = notes.filter((note) => {
    const q = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);
  });

  const handleCreate = useCallback(() => {
    setSelectedNote(null);
    setIsCreating(true);
    setIsEditing(false);
  }, []);

  const handleSelect = useCallback((note: Note) => {
    setSelectedNote(note);
    setIsCreating(false);
    setIsEditing(false);
  }, []);

  const handleEdit = useCallback((note: Note) => {
    setSelectedNote(note);
    setIsCreating(false);
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async (data: NoteFormData) => {
    setIsSaving(true);
    setError(null);
    try {
      if (isCreating) {
        const newNote = await api.createNote(data);
        setIsCreating(false);
        setIsEditing(false);
        const refreshed = await loadNotes({ silent: false });
        const found = refreshed?.find((n) => n.id === newNote.id) ?? newNote;
        setSelectedNote(found);
      } else if (selectedNote) {
        const updated = await api.updateNote(selectedNote.id, data);
        setIsEditing(false);
        const refreshed = await loadNotes({ silent: false });
        const found = refreshed?.find((n) => n.id === updated.id) ?? updated;
        setSelectedNote(found);
      }
    } catch {
      setError('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isCreating, selectedNote, loadNotes]);

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmId) return;
    setError(null);
    try {
      await api.deleteNote(deleteConfirmId);
      const deletedId = deleteConfirmId;
      setDeleteConfirmId(null);
      const refreshed = await loadNotes({ silent: false });
      if (refreshed) {
        const wasSelected = selectedNote?.id === deletedId;
        if (wasSelected) {
          setSelectedNote(refreshed.length > 0 ? refreshed[0] : null);
          setIsCreating(false);
          setIsEditing(false);
        }
      }
    } catch {
      setError('Failed to delete note. Please try again.');
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, selectedNote, loadNotes]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  const handleCancel = useCallback(() => {
    setIsCreating(false);
    setIsEditing(false);
    if (!selectedNote && notes.length > 0) {
      setSelectedNote(notes[0]);
    }
  }, [selectedNote, notes]);

  return {
    notes: filteredNotes,
    selectedNote,
    isCreating,
    isEditing,
    isLoading,
    isRefreshing,
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
  };
}
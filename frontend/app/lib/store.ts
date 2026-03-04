import { Note, NoteFormData } from "../types/note";

const STORAGE_KEY = 'notes-app-data';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultNotes();
  } catch {
    return getDefaultNotes();
  }
}

export function saveNotes(notes: Note[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function createNote(data: NoteFormData): Note {
  const notes = getNotes();
  const note: Note = {
    id: generateId(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveNotes([note, ...notes]);
  return note;
}

export function updateNote(id: string, data: NoteFormData): Note | null {
  const notes = getNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  const updated: Note = { ...notes[idx], ...data, updatedAt: new Date().toISOString() };
  notes[idx] = updated;
  saveNotes(notes);
  return updated;
}

export function deleteNote(id: string): void {
  const notes = getNotes();
  saveNotes(notes.filter((n) => n.id !== id));
}

function getDefaultNotes(): Note[] {
  const defaults: NoteFormData[] = [
    { title: 'Meeting Notes', content: 'Discuss project milestones and assign tasks.' },
    { title: 'Grocery List', content: 'Milk, eggs, bread, and vegetables.' },
    { title: 'Project Ideas', content: 'Build a simple notes API using Node.js and Express.' },
    { title: 'Reminder', content: 'Dentist appointment tomorrow at 10am.' },
    { title: 'Learning Node.js', content: 'Learn how to build a REST API with Express and MongoDB.' },
  ];
  const now = new Date();
  return defaults.map((d, i) => ({
    id: generateId(),
    ...d,
    createdAt: new Date(now.getTime() - i * 3600000).toISOString(),
    updatedAt: new Date(now.getTime() - i * 3600000).toISOString(),
  }));
}
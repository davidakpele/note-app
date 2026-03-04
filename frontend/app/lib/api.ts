import { Note, NoteFormData } from '../types/note';

const BASE_URL = 'http://localhost:8000/api/notes';

function mapNote(raw: any): Note {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${BASE_URL}/`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch notes');
  const json = await res.json();
  return json.data.map(mapNote);
}

export async function fetchNoteById(id: string): Promise<Note> {
  const res = await fetch(`${BASE_URL}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch note');
  const json = await res.json();
  return mapNote(json.data);
}

export async function createNote(data: NoteFormData): Promise<Note> {
  const res = await fetch(`${BASE_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: data.title, content: data.content }),
  });
  if (!res.ok) throw new Error('Failed to create note');
  const json = await res.json();
  return mapNote(json.data);
}

export async function updateNote(id: string, data: NoteFormData): Promise<Note> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: data.title, content: data.content }),
  });
  if (!res.ok) throw new Error('Failed to update note');
  const json = await res.json();
  return mapNote(json.data);
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete note');
}
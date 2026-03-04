'use client';

import React, { useEffect } from 'react';

interface DeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({ onConfirm, onCancel }: DeleteModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__icon">
          <TrashIcon />
        </div>
        <h2 className="modal__title">Delete Note?</h2>
        <p className="modal__body">
          This action cannot be undone. The note will be permanently removed.
        </p>
        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn--danger-solid" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
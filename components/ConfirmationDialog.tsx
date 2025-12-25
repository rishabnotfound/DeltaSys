'use client';

import { useState } from 'react';

interface ConfirmationDialogProps {
  title: string;
  message: string;
  confirmText: string;
  requiredInput: string;
  inputPlaceholder: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export default function ConfirmationDialog({
  title,
  message,
  confirmText,
  requiredInput,
  inputPlaceholder,
  onConfirm,
  onCancel,
  isDangerous = true,
}: ConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const isValid = inputValue === requiredInput;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md">
        {/* Header */}
        <div className={`p-6 border-b border-border ${isDangerous ? 'bg-red-500/10' : ''}`}>
          <div className="flex items-center gap-3">
            {isDangerous && (
              <div className="p-2 bg-red-500/20 rounded-lg">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
            <h2 className={`text-xl font-bold ${isDangerous ? 'text-red-500' : 'text-white'}`}>
              {title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300">{message}</p>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Type <span className="font-mono text-white bg-background px-2 py-0.5 rounded">{requiredInput}</span> to confirm
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>

          {inputValue && !isValid && (
            <p className="text-red-400 text-sm">Input does not match. Please try again.</p>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-border hover:bg-border/80 text-white rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              isDangerous
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-accent hover:bg-accent-hover text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

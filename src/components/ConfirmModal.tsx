"use client";

import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDarkMode = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md p-6 rounded-xl shadow-xl ${
          isDarkMode 
            ? 'bg-[#111] text-white border border-white/10' 
            : 'bg-white text-[#1E1E1E] border border-black/10'
        }`}
      >
        {/* Title */}
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        
        {/* Message */}
        <p className={`mb-6 ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
          {message}
        </p>
        
        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg font-medium ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20' 
                : 'bg-black/10 hover:bg-black/20'
            }`}
          >
            {cancelLabel}
          </button>
          
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

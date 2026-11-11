import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloudArrowUp } from '@phosphor-icons/react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  maxFiles = 5,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files.slice(0, maxFiles));
    }
  }, [disabled, maxFiles, onFilesSelected]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const files = Array.from(target.files);
        onFilesSelected(files.slice(0, maxFiles));
      }
    };
    input.click();
  }, [disabled, maxFiles, onFilesSelected]);

  return (
    <div
      className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl bg-black/20 transition-all duration-300 cursor-pointer ${
        isDragOver ? 'bg-white/5 border-rose-500' : 'border-gray-600 hover:bg-white/5'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      <CloudArrowUp className={`w-16 h-16 text-rose-500 mb-4 ${isDragOver ? 'scale-110' : ''} transition-transform`} />
      <p className="text-gray-300 font-medium">{t('converter.dropzone.title')}</p>
      <p className="text-sm text-gray-500 mt-2">{t('converter.dropzone.subtitle')}</p>
      <button
        type="button"
        onClick={handleClick}
        className="mt-6 px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
        disabled={disabled}
      >
        {t('converter.dropzone.button')}
      </button>
    </div>
  );
};
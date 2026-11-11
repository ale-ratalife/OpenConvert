import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormatDropdown } from './FormatDropdown';
import { TrashSimple, DownloadSimple, Clock, CheckCircle, XCircle, Spinner } from '@phosphor-icons/react';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  targetFormat: string;
  status: 'pending' | 'converting' | 'completed' | 'failed';
  outputPath?: string;
  error?: string;
}

interface FileListProps {
  files: FileItem[];
  onRemove: (id: string) => void;
  onFormatChange: (id: string, format: string) => void;
  onDownload: (id: string) => void;
  maxFiles?: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusIcon = (status: FileItem['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-5 h-5 text-gray-400" />;
    case 'converting':
      return <Spinner className="w-5 h-5 text-rose-500 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />;
  }
};

const getSupportedFormats = (type: string): string[] => {
  const formats: Record<string, string[]> = {
    image: ['PNG', 'JPG', 'WEBP', 'ICO', 'TIFF', 'BMP', 'GIF'],
    video: ['MP4', 'MKV', 'AVI', 'WEBM', 'MOV', 'FLV'],
    audio: ['MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'M4A'],
    document: ['PDF', 'DOCX', 'DOC', 'TXT', 'RTF', 'ODT'],
    ebook: ['EPUB', 'MOBI', 'AZW3', 'PDF'],
    archive: ['ZIP', 'TAR', 'GZ', '7Z'],
  };
  return formats[type] || [];
};

export const FileList: React.FC<FileListProps> = ({
  files,
  onRemove,
  onFormatChange,
  onDownload,
  maxFiles = 5
}) => {
  const { t } = useTranslation();

  if (files.length === 0) {
    return (
      <div className="glass-card text-center py-12">
        <p className="text-gray-400">{t('converter.noFiles')}</p>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden">
      <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-white/10 text-sm font-medium text-gray-400">
        <div className="col-span-4">{t('converter.fileList.name')}</div>
        <div className="col-span-2 hidden md:block">{t('converter.fileList.size')}</div>
        <div className="col-span-3">{t('converter.fileList.targetFormat')}</div>
        <div className="col-span-2">{t('converter.fileList.status')}</div>
        <div className="col-span-1 text-right">{t('converter.fileList.actions')}</div>
      </div>
      <div className="max-h-96 overflow-y-auto scrollbar-hide">
        {files.map((file) => {
          const typeCategory = file.type.split('/')[0];
          const supportedFormats = getSupportedFormats(typeCategory);

          return (
            <div
              key={file.id}
              className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-white/5 animate-in slide-in-from-bottom-2 duration-300 items-center"
            >
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                  {typeCategory === 'image' && <span className="text-rose-500">🖼</span>}
                  {typeCategory === 'video' && <span className="text-blue-500">🎬</span>}
                  {typeCategory === 'audio' && <span className="text-green-500">🎵</span>}
                  {typeCategory === 'application' && <span className="text-yellow-500">📄</span>}
                  {typeCategory === 'text' && <span className="text-purple-500">📝</span>}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 hidden md:block">{file.type}</p>
                </div>
              </div>
              <div className="col-span-2 hidden md:block text-gray-400 text-sm">
                {formatFileSize(file.size)}
              </div>
              <div className="col-span-3">
                <FormatDropdown
                  value={file.targetFormat}
                  onChange={(fmt) => onFormatChange(file.id, fmt)}
                  formats={supportedFormats}
                  disabled={file.status === 'converting' || file.status === 'completed'}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                {getStatusIcon(file.status)}
                <span className="text-sm capitalize">
                  {t(`converter.status.${file.status}`)}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                {file.status === 'completed' && (
                  <button
                    onClick={() => onDownload(file.id)}
                    className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors"
                    title={t('converter.fileList.download')}
                  >
                    <DownloadSimple className="w-5 h-5" />
                  </button>
                )}
                {file.status !== 'converting' && (
                  <button
                    onClick={() => onRemove(file.id)}
                    className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                    title={t('converter.fileList.remove')}
                  >
                    <TrashSimple className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {files.length >= maxFiles && (
        <div className="px-4 py-3 border-t border-white/10 text-center text-sm text-gray-500">
          {t('converter.maxFiles')}
        </div>
      )}
    </div>
  );
};
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { Dropzone } from '../components/Dropzone';
import { FileList } from '../components/FileList';
import { GlassCard } from '../components/GlassCard';
import { ProgressSpinner, ProgressBar } from '../components/ProgressSpinner';
import { DownloadSimple, ArrowRight } from '@phosphor-icons/react';

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

export const ConverterView: React.FC = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const getDefaultTargetFormat = (type: string): string => {
    const category = type.split('/')[0];
    switch (category) {
      case 'image': return 'webp';
      case 'video': return 'mp4';
      case 'audio': return 'mp3';
      case 'application': return 'pdf';
      case 'text': return 'txt';
      default: return 'pdf';
    }
  };

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => {
      const existingNames = new Set(prev.map(f => f.name));
      const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
      const combined = [...prev, ...uniqueNewFiles].slice(0, 5);
      return combined.map((file, index) => ({
        id: `${file.name}-${index}-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        targetFormat: getDefaultTargetFormat(file.type || 'application/octet-stream'),
        status: 'pending' as const,
      }));
    });
  }, []);

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleFormatChange = useCallback((id: string, format: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, targetFormat: format } : f))
    );
  }, []);

  const handleDownload = useCallback(async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.outputPath) {
      await invoke('open_path', { path: file.outputPath });
    }
  }, [files]);

  const handleConvert = useCallback(async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file || file.status === 'converting') return;

    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'converting' as const } : f))
    );

    try {
      const result = await invoke('convert_file', {
        filePath: file.name,
        targetFormat: file.targetFormat,
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'completed' as const, outputPath: result as string } : f
        )
      );
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'failed' as const, error: String(error) } : f
        )
      );
    }
  }, [files]);

  const handleConvertAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsConverting(true);
    setOverallProgress(0);

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      await handleConvert(file.id);
      setOverallProgress(((i + 1) / pendingFiles.length) * 100);
    }

    setIsConverting(false);
    setOverallProgress(100);
  }, [files, handleConvert]);

  const canConvert = files.some((f) => f.status === 'pending');
  const isAllCompleted = files.length > 0 && files.every((f) => f.status === 'completed' || f.status === 'failed');

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('nav.converter')}</h2>
          <p className="text-gray-400">{t('converter.dropzone.subtitle')}</p>
        </div>

        <GlassCard>
          <Dropzone
            onFilesSelected={handleFilesSelected}
            maxFiles={5}
            disabled={isConverting}
          />
        </GlassCard>

        {files.length > 0 && (
          <GlassCard className="pt-0">
            <FileList
              files={files}
              onRemove={handleRemove}
              onFormatChange={handleFormatChange}
              onDownload={handleDownload}
              maxFiles={5}
            />
          </GlassCard>
        )}

        {(canConvert || isConverting) && (
          <GlassCard className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                {isConverting && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">{t('converter.converting')}</span>
                      <span className="text-white font-medium">{Math.round(overallProgress)}%</span>
                    </div>
                    <ProgressBar progress={overallProgress} />
                  </div>
                )}
              </div>
              <button
                onClick={handleConvertAll}
                disabled={isConverting || !canConvert}
                className={`btn-primary flex items-center gap-2 whitespace-nowrap ${
                  isConverting || !canConvert ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isConverting ? (
                  <>
                    <ProgressSpinner size="sm" />
                    {t('converter.converting')}
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    {t('converter.convertAll')}
                  </>
                )}
              </button>
            </div>
          </GlassCard>
        )}

        {isAllCompleted && (
          <GlassCard className="pt-4">
            <div className="text-center text-green-400">
              <DownloadSimple className="w-12 h-12 mx-auto mb-2" />
              <p className="font-medium">{t('converter.downloadReady')}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t('converter.fileList.download')} {files.filter(f => f.status === 'completed').length} {t('common.file')}
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
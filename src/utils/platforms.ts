import type { Platform } from '../types';

export const platformConfig: Record<Platform, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  maxCaptionLength: number;
  supportedContent: string[];
}> = {
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    bgColor: '#E7F0FD',
    icon: 'FB',
    maxCaptionLength: 63206,
    supportedContent: ['image', 'video', 'carousel', 'text', 'story', 'reel'],
  },
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    bgColor: '#FCE4EC',
    icon: 'IG',
    maxCaptionLength: 2200,
    supportedContent: ['image', 'video', 'carousel', 'story', 'reel'],
  },
  youtube: {
    label: 'YouTube',
    color: '#FF0000',
    bgColor: '#FFEBEE',
    icon: 'YT',
    maxCaptionLength: 5000,
    supportedContent: ['video'],
  },
  tiktok: {
    label: 'TikTok',
    color: '#000000',
    bgColor: '#F5F5F5',
    icon: 'TT',
    maxCaptionLength: 2200,
    supportedContent: ['video', 'reel'],
  },
  telegram: {
    label: 'Telegram',
    color: '#2AABEE',
    bgColor: '#E3F2FD',
    icon: 'TG',
    maxCaptionLength: 4096,
    supportedContent: ['image', 'video', 'text', 'document'],
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    bgColor: '#E8F0FE',
    icon: 'LI',
    maxCaptionLength: 3000,
    supportedContent: ['image', 'video', 'text', 'carousel'],
  },
  twitter: {
    label: 'Twitter / X',
    color: '#000000',
    bgColor: '#F5F5F5',
    icon: 'X',
    maxCaptionLength: 280,
    supportedContent: ['image', 'video', 'text'],
  },
  website: {
    label: 'Website',
    color: '#6366f1',
    bgColor: '#EEF2FF',
    icon: 'WB',
    maxCaptionLength: 999999,
    supportedContent: ['image', 'video', 'text', 'carousel'],
  },
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return { bg: '#dcfce7', text: '#16a34a' };
    case 'scheduled': return { bg: '#dbeafe', text: '#2563eb' };
    case 'draft': return { bg: '#f3f4f6', text: '#6b7280' };
    case 'failed': return { bg: '#fee2e2', text: '#dc2626' };
    default: return { bg: '#f3f4f6', text: '#6b7280' };
  }
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

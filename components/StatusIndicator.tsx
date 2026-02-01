
import React from 'react';
import { AppStatus } from '../types';

interface StatusIndicatorProps {
  status: AppStatus;
  error?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, error }) => {
  if (status === AppStatus.IDLE) return null;

  const config = {
    [AppStatus.FETCHING]: {
      label: '📡 正在同步各平台新鲜瓜果...',
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: '⏳'
    },
    [AppStatus.PROCESSING_IMAGE]: {
      label: '🖼️ 正在从截图中提取榜单信息...',
      color: 'bg-purple-50 text-purple-700 border-purple-100',
      icon: '🔎'
    },
    [AppStatus.ANALYZING]: {
      label: '✅ 数据获取成功！AI 博主正在构思文案...',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      icon: '✨'
    },
    [AppStatus.COMPLETED]: {
      label: '🍉 瓜切好了，速来围观！',
      color: 'bg-green-50 text-green-700 border-green-100',
      icon: '🎉'
    },
    [AppStatus.ERROR]: {
      label: error || '糟糕，瓜田翻了...',
      color: 'bg-red-50 text-red-700 border-red-100',
      icon: '❌'
    },
    [AppStatus.IDLE]: { label: '', color: '', icon: '' }
  };

  const current = config[status];

  return (
    <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 animate-in slide-in-from-top-2 duration-500 ${current.color}`}>
      <span className="text-2xl">{current.icon}</span>
      <span className="font-bold text-base">{current.label}</span>
    </div>
  );
};

export default StatusIndicator;

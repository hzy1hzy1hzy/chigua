
export type NewsSource = '微博热搜' | '抖音热搜';
export type AppMode = 'screenshot' | 'traditional';

export interface HotItem {
  title: string;
  url: string;
  hotness?: string;
  tag?: string; // e.g., '新', '热', '爆', '荐'
}

export interface RawResults {
  [key: string]: HotItem[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  FETCHING = 'FETCHING',
  PROCESSING_IMAGE = 'PROCESSING_IMAGE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ClipboardItem {
  id: number;
  content: string;
  contentPreview: string;
  createdAt: number;
  isFavorite: boolean;
  source: 'share' | 'manual' | 'paste';
}

export interface ClipboardItemInput {
  content: string;
  source: 'share' | 'manual' | 'paste';
}

export interface Settings {
  autoDeleteDays: number | null; // null means never
  maxItems: number;
}

export type RootStackParamList = {
  Home: undefined;
  Search: undefined;
  Settings: undefined;
};

export interface DatabaseResult {
  insertId?: number;
  rowsAffected: number;
}

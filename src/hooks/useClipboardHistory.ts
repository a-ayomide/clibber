import {useState, useEffect, useCallback} from 'react';
import {ClipboardItem} from '../types';
import {
  getAllItems,
  addItem,
  deleteItem,
  toggleFavorite,
  deleteOldItems,
} from '../services/database';
import {
  saveCurrentClipboard,
  saveSharedContent,
  copyToClipboard,
} from '../services/clipboard';

interface UseClipboardHistoryReturn {
  items: ClipboardItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveClipboard: () => Promise<boolean>;
  saveShared: (content: string) => Promise<boolean>;
  removeItem: (id: number) => Promise<void>;
  toggleItemFavorite: (id: number) => Promise<void>;
  copyItem: (item: ClipboardItem) => void;
}

export function useClipboardHistory(): UseClipboardHistoryReturn {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Clean up old items first
      await deleteOldItems();

      // Load all items
      const loadedItems = await getAllItems();
      setItems(loadedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const refresh = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  const saveClipboard = useCallback(async (): Promise<boolean> => {
    try {
      const saved = await saveCurrentClipboard();
      if (saved) {
        await loadItems();
      }
      return saved;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save clipboard',
      );
      return false;
    }
  }, [loadItems]);

  const saveShared = useCallback(
    async (content: string): Promise<boolean> => {
      try {
        const saved = await saveSharedContent(content);
        if (saved) {
          await loadItems();
        }
        return saved;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to save shared content',
        );
        return false;
      }
    },
    [loadItems],
  );

  const removeItem = useCallback(
    async (id: number): Promise<void> => {
      try {
        await deleteItem(id);
        setItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete item');
      }
    },
    [],
  );

  const toggleItemFavorite = useCallback(async (id: number): Promise<void> => {
    try {
      const newStatus = await toggleFavorite(id);
      setItems(prev =>
        prev.map(item =>
          item.id === id ? {...item, isFavorite: newStatus} : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to toggle favorite',
      );
    }
  }, []);

  const copyItem = useCallback((item: ClipboardItem): void => {
    copyToClipboard(item.content);
  }, []);

  return {
    items,
    loading,
    error,
    refresh,
    saveClipboard,
    saveShared,
    removeItem,
    toggleItemFavorite,
    copyItem,
  };
}

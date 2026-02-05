import {useState, useEffect, useCallback, useMemo} from 'react';
import {ClipboardItem} from '../types';
import {searchItems} from '../services/database';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: ClipboardItem[];
  loading: boolean;
  error: string | null;
  clearSearch: () => void;
}

/**
 * Hook for searching clipboard history
 * Implements debounced search with real-time filtering
 */
export function useSearch(debounceMs: number = 300): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timeoutId = setTimeout(async () => {
      try {
        const searchResults = await searchItems(query.trim());
        setResults(searchResults);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch,
  };
}

/**
 * Hook for filtering items locally (for when items are already loaded)
 */
export function useLocalSearch(items: ClipboardItem[]): {
  query: string;
  setQuery: (query: string) => void;
  filteredItems: ClipboardItem[];
  clearSearch: () => void;
} {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return items;
    }

    const lowerQuery = query.toLowerCase().trim();
    return items.filter(item =>
      item.content.toLowerCase().includes(lowerQuery),
    );
  }, [items, query]);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    filteredItems,
    clearSearch,
  };
}

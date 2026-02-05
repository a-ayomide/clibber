import React, {useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ClipboardItemCard} from '../components/ClipboardItem';
import {SearchBar} from '../components/SearchBar';
import {EmptyState} from '../components/EmptyState';
import {useSearch} from '../hooks/useSearch';
import {ClipboardItem, RootStackParamList} from '../types';
import {copyToClipboard} from '../services/clipboard';
import {deleteItem, toggleFavorite} from '../services/database';

type SearchScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Search'>;
};

export function SearchScreen({}: SearchScreenProps): React.JSX.Element {
  const {query, setQuery, results, loading, error, clearSearch} = useSearch();

  const handleItemPress = useCallback((item: ClipboardItem) => {
    copyToClipboard(item.content);
    Alert.alert('Copied!', 'Content copied to clipboard');
  }, []);

  const handleCopy = useCallback((item: ClipboardItem) => {
    copyToClipboard(item.content);
    Alert.alert('Copied!', 'Content copied to clipboard');
  }, []);

  const handleDelete = useCallback((item: ClipboardItem) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          // Re-trigger search to update results
          setQuery(query);
        },
      },
    ]);
  }, [query, setQuery]);

  const handleToggleFavorite = useCallback(
    async (item: ClipboardItem) => {
      await toggleFavorite(item.id);
      // Re-trigger search to update results
      setQuery(query);
    },
    [query, setQuery],
  );

  const renderItem = useCallback(
    ({item}: {item: ClipboardItem}) => (
      <ClipboardItemCard
        item={item}
        onPress={handleItemPress}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
        searchQuery={query}
      />
    ),
    [handleItemPress, handleCopy, handleDelete, handleToggleFavorite, query],
  );

  const keyExtractor = useCallback(
    (item: ClipboardItem) => item.id.toString(),
    [],
  );

  const renderEmpty = () => {
    if (!query) {
      return (
        <EmptyState
          title="Search Your History"
          message="Type to search through your clipboard history"
          icon="🔍"
        />
      );
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    return (
      <EmptyState
        title="No Results"
        message={`No items found matching "${query}"`}
        icon="🔎"
      />
    );
  };

  return (
    <View style={styles.container}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onClear={clearSearch}
        autoFocus={true}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={
          results.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    padding: 16,
  },
});

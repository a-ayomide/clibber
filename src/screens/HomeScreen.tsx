import React, {useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ClipboardItemCard} from '../components/ClipboardItem';
import {EmptyState} from '../components/EmptyState';
import {useClipboardHistory} from '../hooks/useClipboardHistory';
import {ClipboardItem, RootStackParamList} from '../types';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({navigation}: HomeScreenProps): React.JSX.Element {
  const {
    items,
    loading,
    error,
    refresh,
    saveClipboard,
    removeItem,
    toggleItemFavorite,
    copyItem,
  } = useClipboardHistory();

  const handleItemPress = useCallback(
    (item: ClipboardItem) => {
      copyItem(item);
      Alert.alert('Copied!', 'Content copied to clipboard');
    },
    [copyItem],
  );

  const handleCopy = useCallback(
    (item: ClipboardItem) => {
      copyItem(item);
      Alert.alert('Copied!', 'Content copied to clipboard');
    },
    [copyItem],
  );

  const handleDelete = useCallback(
    (item: ClipboardItem) => {
      Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeItem(item.id),
        },
      ]);
    },
    [removeItem],
  );

  const handleToggleFavorite = useCallback(
    (item: ClipboardItem) => {
      toggleItemFavorite(item.id);
    },
    [toggleItemFavorite],
  );

  const handleSaveClipboard = useCallback(async () => {
    const saved = await saveClipboard();
    if (saved) {
      Alert.alert('Saved!', 'Clipboard content has been saved');
    } else {
      Alert.alert(
        'Nothing to save',
        'Clipboard is empty or content was already saved',
      );
    }
  }, [saveClipboard]);

  const renderItem = useCallback(
    ({item}: {item: ClipboardItem}) => (
      <ClipboardItemCard
        item={item}
        onPress={handleItemPress}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
      />
    ),
    [handleItemPress, handleCopy, handleDelete, handleToggleFavorite],
  );

  const keyExtractor = useCallback(
    (item: ClipboardItem) => item.id.toString(),
    [],
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Search')}>
            <Text style={styles.headerButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  if (loading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading clipboard history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={
          items.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Clipboard History"
            message="Share text from other apps or tap the + button to save your current clipboard"
            icon="📋"
          />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleSaveClipboard}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
});

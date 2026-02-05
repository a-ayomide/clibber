import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {ClipboardItem as ClipboardItemType} from '../types';
import {formatRelativeTime} from '../utils/formatters';

interface ClipboardItemProps {
  item: ClipboardItemType;
  onPress: (item: ClipboardItemType) => void;
  onCopy: (item: ClipboardItemType) => void;
  onDelete: (item: ClipboardItemType) => void;
  onToggleFavorite: (item: ClipboardItemType) => void;
  searchQuery?: string;
}

export function ClipboardItemCard({
  item,
  onPress,
  onCopy,
  onDelete,
  onToggleFavorite,
  searchQuery,
}: ClipboardItemProps): React.JSX.Element {
  const renderHighlightedText = () => {
    if (!searchQuery) {
      return <Text style={styles.content}>{item.contentPreview}</Text>;
    }

    const lowerContent = item.contentPreview.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const parts: React.JSX.Element[] = [];
    let lastIndex = 0;
    let key = 0;

    let index = lowerContent.indexOf(lowerQuery);
    while (index !== -1) {
      if (index > lastIndex) {
        parts.push(
          <Text key={key++} style={styles.content}>
            {item.contentPreview.slice(lastIndex, index)}
          </Text>,
        );
      }

      parts.push(
        <Text key={key++} style={[styles.content, styles.highlight]}>
          {item.contentPreview.slice(index, index + searchQuery.length)}
        </Text>,
      );

      lastIndex = index + searchQuery.length;
      index = lowerContent.indexOf(lowerQuery, lastIndex);
    }

    if (lastIndex < item.contentPreview.length) {
      parts.push(
        <Text key={key++} style={styles.content}>
          {item.contentPreview.slice(lastIndex)}
        </Text>,
      );
    }

    return <Text>{parts}</Text>;
  };

  return (
    <Pressable
      style={({pressed}) => [styles.container, pressed && styles.pressed]}
      onPress={() => onPress(item)}>
      <View style={styles.header}>
        <Text style={styles.timestamp}>
          {formatRelativeTime(item.createdAt)}
        </Text>
        <View style={styles.badges}>
          {item.isFavorite && <Text style={styles.favoriteBadge}>★</Text>}
          <Text style={styles.sourceBadge}>{item.source}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>{renderHighlightedText()}</View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onCopy(item)}
          accessibilityLabel="Copy to clipboard">
          <Text style={styles.actionText}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onToggleFavorite(item)}
          accessibilityLabel={
            item.isFavorite ? 'Remove from favorites' : 'Add to favorites'
          }>
          <Text style={styles.actionText}>
            {item.isFavorite ? '★ Unfavorite' : '☆ Favorite'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(item)}
          accessibilityLabel="Delete item">
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: {
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteBadge: {
    fontSize: 14,
    color: '#FFB800',
  },
  sourceBadge: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  contentContainer: {
    marginBottom: 12,
  },
  content: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  highlight: {
    backgroundColor: '#FFEB3B',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fee',
  },
  deleteText: {
    color: '#d32f2f',
  },
});

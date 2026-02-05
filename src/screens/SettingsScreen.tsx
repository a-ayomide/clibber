import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {getAllSettings, setSetting, clearAllItems} from '../services/database';

interface SettingsState {
  autoDeleteDays: number | null;
  maxItems: number;
}

const AUTO_DELETE_OPTIONS = [
  {label: 'Never', value: null},
  {label: '7 days', value: 7},
  {label: '30 days', value: 30},
  {label: '60 days', value: 60},
  {label: '90 days', value: 90},
];

const MAX_ITEMS_OPTIONS = [
  {label: '100 items', value: 100},
  {label: '500 items', value: 500},
  {label: '1000 items', value: 1000},
  {label: '5000 items', value: 5000},
];

export function SettingsScreen(): React.JSX.Element {
  const [settings, setSettings] = useState<SettingsState>({
    autoDeleteDays: null,
    maxItems: 1000,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await getAllSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDeleteChange = useCallback(async (value: number | null) => {
    const stringValue = value === null ? 'null' : value.toString();
    await setSetting('auto_delete_days', stringValue);
    setSettings(prev => ({...prev, autoDeleteDays: value}));
  }, []);

  const handleMaxItemsChange = useCallback(async (value: number) => {
    await setSetting('max_items', value.toString());
    setSettings(prev => ({...prev, maxItems: value}));
  }, []);

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all clipboard history? Favorites will be kept.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const count = await clearAllItems(true);
            Alert.alert('Cleared', `${count} items deleted`);
          },
        },
      ],
    );
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Delete Everything',
      'Are you sure you want to delete ALL clipboard history, including favorites? This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            const count = await clearAllItems(false);
            Alert.alert('Cleared', `${count} items deleted`);
          },
        },
      ],
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto-Delete Old Items</Text>
        <Text style={styles.sectionDescription}>
          Automatically delete items older than the selected period (favorites
          are excluded)
        </Text>
        <View style={styles.optionGroup}>
          {AUTO_DELETE_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.optionButton,
                settings.autoDeleteDays === option.value &&
                  styles.optionButtonSelected,
              ]}
              onPress={() => handleAutoDeleteChange(option.value)}>
              <Text
                style={[
                  styles.optionText,
                  settings.autoDeleteDays === option.value &&
                    styles.optionTextSelected,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maximum Items</Text>
        <Text style={styles.sectionDescription}>
          Limit the total number of items stored (oldest items are deleted
          first, favorites are excluded)
        </Text>
        <View style={styles.optionGroup}>
          {MAX_ITEMS_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.optionButton,
                settings.maxItems === option.value &&
                  styles.optionButtonSelected,
              ]}
              onPress={() => handleMaxItemsChange(option.value)}>
              <Text
                style={[
                  styles.optionText,
                  settings.maxItems === option.value &&
                    styles.optionTextSelected,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleClearHistory}>
          <Text style={styles.dangerButtonText}>
            Clear History (Keep Favorites)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dangerButton, styles.dangerButtonRed]}
          onPress={handleClearAll}>
          <Text style={styles.dangerButtonText}>Delete Everything</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutInfo}>
          <Text style={styles.aboutText}>Clibber</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDescription}>
            A simple clipboard manager that helps you keep track of your copied
            text. Share text from any app to save it to your clipboard history.
          </Text>
        </View>
      </View>
    </ScrollView>
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
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
  },
  dangerButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginTop: 8,
  },
  dangerButtonRed: {
    backgroundColor: '#fee',
  },
  dangerButtonText: {
    fontSize: 15,
    color: '#d32f2f',
    fontWeight: '500',
    textAlign: 'center',
  },
  aboutInfo: {
    marginTop: 8,
  },
  aboutText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  aboutVersion: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    lineHeight: 20,
  },
});

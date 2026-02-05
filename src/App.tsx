import React, {useEffect} from 'react';
import {StatusBar, Platform} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import ShareMenu from 'react-native-share-menu';

import {HomeScreen} from './screens/HomeScreen';
import {SearchScreen} from './screens/SearchScreen';
import {SettingsScreen} from './screens/SettingsScreen';
import {RootStackParamList} from './types';
import {saveSharedContent} from './services/clipboard';
import {openDatabase} from './services/database';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize database on app start
    openDatabase().catch(console.error);

    // Handle share menu for Android
    if (Platform.OS === 'android') {
      ShareMenu.getInitialShare(handleShare);
    }

    // Listen for new shares
    const listener = ShareMenu.addNewShareListener(handleShare);

    return () => {
      listener.remove();
    };
  }, []);

  const handleShare = async (item: {
    mimeType: string;
    data: string;
    extraData?: any;
  } | null) => {
    if (!item) {
      return;
    }

    const {mimeType, data} = item;

    // Only handle text content
    if (mimeType.startsWith('text/') && data) {
      try {
        await saveSharedContent(data);
      } catch (error) {
        console.error('Failed to save shared content:', error);
      }
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#333',
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: '#f5f5f5',
            },
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Clibber',
              headerLargeTitle: true,
            }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{
              title: 'Search',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Settings',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;

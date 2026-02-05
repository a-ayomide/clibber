# Clibber - Clipboard Manager

A cross-platform clipboard manager built with React Native that stores clipboard history and allows users to view, search, and copy past items.

## Features

- **Clipboard History**: Store and view all your copied text
- **Search**: Full-text search through your clipboard history
- **Favorites**: Mark important items as favorites (protected from auto-delete)
- **Share Extension**: Share text from any app directly to Clibber
  - iOS: Native Share Extension
  - Android: Share Intent handler
- **Settings**:
  - Auto-delete old items (7/30/60/90 days or never)
  - Maximum items limit
- **Persistent Storage**: SQLite database for long-term storage

## Requirements

- Node.js 18+
- iOS 17+ (for iOS development)
- Android SDK 24+ (for Android development)
- Xcode 15+ (for iOS development)
- CocoaPods (for iOS development)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **iOS Setup**:
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Configure iOS App Groups** (for Share Extension):
   - Open `ios/clibber.xcodeproj` in Xcode
   - Select the main target and go to "Signing & Capabilities"
   - Add "App Groups" capability with identifier: `group.com.clibber.shared`
   - Do the same for the ShareExtension target

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Project Structure

```
clibber/
├── src/
│   ├── App.tsx                    # Main app entry with navigation
│   ├── screens/
│   │   ├── HomeScreen.tsx         # Main clipboard history list
│   │   ├── SettingsScreen.tsx     # App settings
│   │   └── SearchScreen.tsx       # Search history
│   ├── components/
│   │   ├── ClipboardItem.tsx      # Single clipboard item card
│   │   ├── EmptyState.tsx         # Empty list placeholder
│   │   └── SearchBar.tsx          # Search input component
│   ├── hooks/
│   │   ├── useClipboardHistory.ts # Hook for clipboard operations
│   │   └── useSearch.ts           # Search filtering hook
│   ├── services/
│   │   ├── database.ts            # SQLite database service
│   │   └── clipboard.ts           # Clipboard read/write service
│   ├── types/
│   │   └── index.ts               # TypeScript types
│   └── utils/
│       └── formatters.ts          # Date/text formatting utilities
├── ios/
│   ├── clibber/                   # Main iOS app files
│   └── ShareExtension/            # iOS Share Extension
│       ├── ShareViewController.swift
│       ├── Info.plist
│       └── ShareExtension.entitlements
├── android/
│   └── app/src/main/
│       └── java/com/clibber/
│           ├── MainActivity.kt
│           ├── MainApplication.kt
│           └── ShareActivity.kt   # Android Share Intent handler
└── package.json
```

## Usage

### Saving Clipboard Content

1. **Manual Save**: Tap the + (FAB) button to save the current clipboard content
2. **Share Extension**:
   - Select text in any app
   - Tap "Share" and choose "Save to Clibber" (iOS) or "Clibber" (Android)

### Managing Items

- **Copy**: Tap any item or press the "Copy" button to copy it back to clipboard
- **Favorite**: Tap the star button to mark as favorite
- **Delete**: Tap the delete button and confirm
- **Search**: Tap the search icon to search through history

### Settings

- **Auto-Delete**: Choose how long to keep items (7/30/60/90 days or never)
- **Maximum Items**: Set a limit on stored items (100/500/1000/5000)
- **Clear History**: Delete all non-favorite items
- **Delete Everything**: Delete all items including favorites

## Database Schema

```sql
CREATE TABLE clipboard_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  content_preview TEXT,
  created_at INTEGER NOT NULL,
  is_favorite INTEGER DEFAULT 0,
  source TEXT  -- 'share' | 'manual' | 'paste'
);
```

## Testing

### Test Share Extension (iOS)
1. Build and run the app
2. Open Safari, select some text
3. Tap Share and choose "Save to Clibber"
4. Verify the item appears in the app

### Test Share Intent (Android)
1. Build and run the app
2. Open Chrome, select some text
3. Tap Share and choose "Clibber"
4. Verify the item appears in the app

## License

MIT

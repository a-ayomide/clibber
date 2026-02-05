import Clipboard from '@react-native-clipboard/clipboard';
import {addItem} from './database';
import {ClipboardItemInput} from '../types';

/**
 * Get current clipboard content
 */
export async function getClipboardContent(): Promise<string> {
  return await Clipboard.getString();
}

/**
 * Set clipboard content
 */
export function setClipboardContent(content: string): void {
  Clipboard.setString(content);
}

/**
 * Copy an item back to the system clipboard
 */
export function copyToClipboard(content: string): void {
  setClipboardContent(content);
}

/**
 * Save current clipboard content to database
 */
export async function saveCurrentClipboard(): Promise<boolean> {
  const content = await getClipboardContent();

  if (!content || content.trim().length === 0) {
    return false;
  }

  const input: ClipboardItemInput = {
    content: content.trim(),
    source: 'manual',
  };

  const result = await addItem(input);
  return result.rowsAffected > 0;
}

/**
 * Save shared content to database (from share extension/intent)
 */
export async function saveSharedContent(content: string): Promise<boolean> {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const input: ClipboardItemInput = {
    content: content.trim(),
    source: 'share',
  };

  const result = await addItem(input);
  return result.rowsAffected > 0;
}

/**
 * Check if clipboard has content
 */
export async function hasClipboardContent(): Promise<boolean> {
  const content = await getClipboardContent();
  return content.length > 0;
}

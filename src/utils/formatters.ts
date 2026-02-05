/**
 * Format a timestamp to a relative time string (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate a preview of clipboard content (first 100 characters, single line)
 */
export function generatePreview(content: string): string {
  // Replace newlines with spaces and collapse multiple spaces
  const singleLine = content.replace(/\s+/g, ' ').trim();
  return truncateText(singleLine, 100);
}

/**
 * Format a timestamp to a full date/time string
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Highlight matching text in a string by wrapping it with markers
 */
export function highlightMatch(
  text: string,
  query: string,
): {text: string; isMatch: boolean}[] {
  if (!query) {
    return [{text, isMatch: false}];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: {text: string; isMatch: boolean}[] = [];
  let lastIndex = 0;

  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    // Add non-matching part before the match
    if (index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, index),
        isMatch: false,
      });
    }

    // Add matching part
    parts.push({
      text: text.slice(index, index + query.length),
      isMatch: true,
    });

    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  // Add remaining non-matching part
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isMatch: false,
    });
  }

  return parts.length > 0 ? parts : [{text, isMatch: false}];
}

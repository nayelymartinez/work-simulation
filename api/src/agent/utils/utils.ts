import { encode } from 'gpt-3-encoder';

export function countTokens(text: string): number {
  return encode(text).length;
}

// Conditionally chunks transcript by sections (or topics) if text exceeds maxTokens.
// A new "topic" is created every time the therapist asks a question.
export function chunkTranscript(
  text: string,
  tokenCount: number,
  maxTokens: number,
): string[] {
  if (tokenCount < maxTokens) {
    console.log(
      'Transcript is under max tokens, returning original transcript',
    );
    return [text];
  }
  const lines = text.split('\n');
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    currentChunk.push(line);

    // Detect therapist (Speaker:0) question
    if (line.startsWith('[Speaker:0]') && line.trim().endsWith('?')) {
      chunks.push(currentChunk.join('\n').trim());
      currentChunk = [];
    }
  }
  // Add any trailing lines as last chunk
  if (currentChunk.length) chunks.push(currentChunk.join('\n').trim());
  return chunks;
}

// Quick util fn to format date time for a nice display
// e.g. 2025-06-10T04:45:54.902Z -> "June 01, 2025 at 12am"
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  };
  // Example: "June 01, 2025, 12:00 AM"
  const formatted = date.toLocaleString('en-US', options);
  // Convert "June 01, 2025, 12:00 AM" to "June 01, 2025 at 12am"
  return formatted
    .replace(', ', ' at ')
    .replace(':00 ', '')
    .replace(' AM', 'am')
    .replace(' PM', 'pm');
}

// TODO: Add better sanitization
// For securiy, remove control characters except for newlines (\n), carriage returns (\r), and tabs (\t)
export function sanitizeTranscriptContent(input: string): string {
  // Remove control characters except for newlines (\n), carriage returns (\r), and tabs (\t)
  return input.replace(/[^\t\n\r\x20-\x7E]/g, '');
}

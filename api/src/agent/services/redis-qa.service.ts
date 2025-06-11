import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis', // NOT 'localhost'!
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
});

// Helper function to format Q&A history as a system block for MCP context
export function makeQAHistoryBlock(
  history: { role: string; content: string }[],
): { name: string; role: 'system'; content: string } | null {
  if (!history || history.length === 0) return null;

  // Format as user/assistant dialog pairs
  let block = '';
  history.forEach((h, idx) => {
    block += `[${h.role === 'user' ? 'Therapist' : 'Agent'}]: ${h.content}\n`;
  });

  return {
    name: 'Previous Q&A',
    role: 'system' as const,
    content: block.trim(),
  };
}

// Save Q&A to Redis
export async function saveQAHistory(
  user_id: number,
  transcript_id: number,
  question: string,
  answer: string,
  maxPairs: number = 6,
) {
  const key = `session_history:${user_id}:${transcript_id}`;
  await redis.rpush(
    key,
    JSON.stringify({ role: 'user', content: question }),
    JSON.stringify({ role: 'assistant', content: answer }),
  );
  // Trim to keep only most recent N pairs (N * 2 for user+assistant)
  await redis.ltrim(key, -maxPairs * 2, -1);
}

// Fetch Q&A history (as array of {role, content})
export async function fetchQAHistory(
  user_id: number,
  transcript_id: number,
  maxPairs: number = 6,
): Promise<{ role: string; content: string }[]> {
  const key = `session_history:${user_id}:${transcript_id}`;
  const arr = await redis.lrange(key, -maxPairs * 2, -1);
  return arr.map((x) => JSON.parse(x) as { role: string; content: string });
}

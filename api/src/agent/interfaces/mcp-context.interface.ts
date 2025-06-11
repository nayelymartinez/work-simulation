export interface MCPContext {
  version: 'v1';
  system: string; // overall behavior instructions
  context: {
    name: string; // e.g. “Transcript”, “Session Metadata”
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  input: string; // e.g. the therapist’s question
}

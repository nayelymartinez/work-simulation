import { SessionMetadata } from './agent.service';

import { ChatMessage } from './interfaces/chat-message.interface';
import { MCPContext } from './interfaces/mcp-context.interface';
import { makeQAHistoryBlock } from './services/redis-qa.service';

export function buildPrompt(
  transcript: string,
  metadata: SessionMetadata,
  question: string,
  history: { role: string; content: string }[] = [],
) {
  const systemInstructions = AGENT_SYSTEM_PROMPT;
  const mcpContext = buildMCPContext(
    systemInstructions,
    transcript,
    metadata,
    question,
    history,
  );

  // Use the SDK's helper to get messages in the right format for your LLM
  const messages = flattenMCP(mcpContext);
  return messages;
}

/**
 * Builds a Model Context Protocol Context object using the MCP SDK types.
 * - systemInstructions: system prompt (instructions for the AI agent)
 * - transcript: the transcript string
 * - metadata: object containing session metadata (e.g. date, patient name, etc.)
 * - question: user's question
 */
export function buildMCPContext(
  systemInstructions: string,
  transcript: string,
  metadata: SessionMetadata,
  question: string,
  history: { role: string; content: string }[] = [],
): MCPContext {
  const contextBlocks = [
    {
      name: 'Transcript',
      role: 'system' as const,
      content: transcript,
    },
    {
      name: 'Session Metadata',
      role: 'system' as const,
      content: Object.entries(metadata)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n'),
    },
  ];

  // Insert Q&A history (if it exists) after metadata, before new question
  const qaBlock = makeQAHistoryBlock(history);
  if (qaBlock) contextBlocks.push(qaBlock);

  return {
    version: 'v1',
    system: systemInstructions,
    context: contextBlocks,
    input: question,
  };
}

export function flattenMCP(ctx: MCPContext): ChatMessage[] {
  const msgs: ChatMessage[] = [];
  msgs.push({ role: 'system', content: ctx.system });

  for (const block of ctx.context) {
    msgs.push({
      role: block.role,
      content: `${block.name}:\n${block.content}`,
    });
  }

  msgs.push({ role: 'user', content: ctx.input });
  return msgs;
}

export const AGENT_SYSTEM_PROMPT = `### ROLE AND OBJECTIVES
You are an AI assistant that helps mental health professionals by answering questions about the content of a therapy session transcript between a therapist and a patient. Your primary goal is to provide accurate, relevant, and concise answers, using only information present in the transcript.

### INSTRUCTIONS / RESPONSE RULES
- BE CONCISE. Limit your response to 3 sentences at most.
- Only include the most essential information.
- ONLY use information explicitly present in the transcript or session metadata.
- When possible, include direct quotes or references to the transcript, with speaker tags (e.g., [therapist_name], [patient_name], etc.) from the session metadata.
- DO NOT speculate, infer diagnoses, or provide clinical advice.
- If the transcript lacks sufficient information, reply: "The transcript does not provide enough information to answer this question." OR reply: "It doesn't look like that was mentioned during the session."
- Remain professional, neutral, and concise.
- Avoid patient identifiers unless explicitly mentioned in the transcript.
- If the question mentions pronouns (e.g. "she", "he", "they"), assume the patient is the subject of the question. 
- NEVER refer to the patient as Speaker:0 or Speaker:1. Use the patient name found in the session metadata (patient_name) instead or "patient" if the name is not known.
- Always refer to the patient using the name provided in the session metadata (patient_name).
- If relevant, reference the session date (session_date), patient's first session date (patient_first_session_date), or therapist's name (therapist_name) from the metadata.
- If you cannot find the information in the transcript or session metadata, reply: "The transcript does not provide enough information to answer this question."
- If the pronoun does not match the patient name, use the patient name.
- Do NOT mention the transcript ID in your response.
- Do NOT say things like "Concise Summary" or "Here's a summary of the transcript" in your response.

### CONTEXT
You will be given a transcript of a session between a therapist and a patient, formatted with speaker tags. The transcript may include discussions about mood, symptoms, social context, thoughts, and feelings. You will also be given session metadata (e.g., patient name, therapist name, session date). Your answers should support mental health professionals in understanding and summarizing relevant aspects of the session.

### EXAMPLES (FEW-SHOT PROMPTING)
#### Example 1
**Input:** What symptoms does report?
**Output:** 
The patient reports feeling "quite bad," "down," and "unmotivated." For example, the patient states, "[Patient] I just can't really be bothered to do anything at all." They also mention trouble sleeping: "[Patient] I just can't seem to have a satisfied night sleep. It's really, really frustrating."

#### Example 2
**Input:** How long has she been experiencing these difficulties?
**Output:** 
The patient describes feeling down for "quite a few months," noting, "[Patient] Quite a few months before that as well, actually. But it's gotten pretty bad these past few months."

#### Example 3
**Input:** Does he mention any support system?
**Output:** 
The patient feels isolated, stating, "[Patient] There's not really anyone to talk about it," and "No one would listen or understand anyway." They also say they don't talk to their parents about it.

### REASONING STEPS (CHAIN OF THOUGHT - COT)
For complex or multi-part questions, think step by step:
1. Identify all relevant sections of the transcript.
2. Extract direct statements or paraphrase them with references.
3. Organize information clearly and cite the speaker.
4. If there is insufficient information, state so.

### OUTPUT FORMATTING CONSTRAINTS
- Use bullet points or paragraphs for clarity as needed.
- Always include direct quotes where possible.
- Separate any direct quotes, bullet points, or paragraphs with a new line.
- Start with a summary sentence, then list supporting quotes.
- If the answer is negative or unclear, use the prescribed phrase.

### DELIMITERS AND STRUCTURE
- Each section of this prompt is separated by triple hashtags (###).
`;

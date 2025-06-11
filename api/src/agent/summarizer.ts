import { ChatOpenAI } from '@langchain/openai';
import { loadSummarizationChain } from 'langchain/chains';
import { PromptTemplate } from '@langchain/core/prompts';
import type { ConfigService } from '@nestjs/config';

const TWO_SENTENCE_SUMMARY_PROMPT = PromptTemplate.fromTemplate(
  `Summarize the following text concisely in no more than one sentence and no more than 30 words:\n\n{text}\n\nSummary:`,
);

function getLLM(configService: ConfigService) {
  const openAIApiKey = configService.get<string>('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('Missing environment variable: OPENAI_API_KEY');
  }
  return new ChatOpenAI({
    openAIApiKey,
    modelName: configService.get<string>('SUMMARIZER_LLM') ?? 'gpt-4-turbo',
  });
}

/*
  Summarize a chunk of text with LangChain, limiting to 2 sentences.
*/
export async function summarizeChunkWithLangChain(
  chunk: string,
  configService: ConfigService,
  concise: boolean = false,
): Promise<string> {
  const llm = getLLM(configService);
  const chain = loadSummarizationChain(llm, {
    type: 'stuff',
    prompt: concise ? TWO_SENTENCE_SUMMARY_PROMPT : undefined,
  });
  const result = (await chain.call({
    input_documents: [{ pageContent: chunk }],
  })) as { text: string };
  return result.text.trim();
}

import { ChatOpenAI } from '@langchain/openai';
import { StuffDocumentsChain } from 'langchain/chains';
import { PromptTemplate } from '@langchain/core/prompts';
import type { ConfigService } from '@nestjs/config';

const TWO_SENTENCE_SUMMARY_PROMPT = PromptTemplate.fromTemplate(
  `Summarize the following text in no more than two sentences:\n\n{text}\n\nSummary:`,
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
): Promise<string> {
  const llm = getLLM(configService);

  // manually instantiate a "stuff" chain with our custom prompt
  const chain = new StuffDocumentsChain({
    llm,
    prompt: TWO_SENTENCE_SUMMARY_PROMPT,
    // this must match the variable in your template: {text}
    documentVariableName: 'text',
  });

  const { text } = await chain.call({
    input_documents: [{ pageContent: chunk }],
  });
  return text.trim();
}

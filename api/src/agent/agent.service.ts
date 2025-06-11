import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import OpenAI from 'openai';
import { Pool } from 'pg';
import { Database } from 'src/db/db';
import { ChatMessage } from './interfaces/chat-message.interface';
import { buildPrompt } from './prompt-builder';
import {
  chunkTranscript,
  countTokens,
  formatDateTime,
  sanitizeTranscriptContent,
} from './utils/utils';
import { summarizeChunkWithLangChain } from './services/langchain.service';
import { PatientRecord } from 'src/db/types/patient-record.type';
import { TranscriptRecord } from 'src/db/types/transcript-record.type';
import { UserRecord } from 'src/db/types/user-record.type';
import { fetchQAHistory, saveQAHistory } from './services/redis-qa.service';

@Injectable()
export class AgentService {
  private openai: OpenAI;
  private db: Kysely<Database>;

  constructor(private configService: ConfigService) {
    // OpenAI init
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const config = {
      apiKey: apiKey,
      baseURL: 'https://oai.helicone.ai/v1',
      defaultHeaders: {
        'Helicone-Auth': `Bearer ${this.configService.get<string>('HELICONE_API_KEY')}`,
      },
    };
    this.openai = new OpenAI(config);

    // Kysely DB init
    this.db = new Kysely<Database>({
      dialect: new PostgresDialect({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        pool: new Pool({
          connectionString: this.configService.get<string>('DATABASE_URL'),
        }),
      }),
    });
  }

  /*
  TODO: Pre-process transcripts to avoid real-time chunking, sanitization, and summarization calls to LLM
  
  The agent uses MCP protocol to send chat messages to the LLM and LangChain for summarization (chunks or whole transcript)
  Because of this, we can easily swap out LLMs
  If the transcript is:
  - <8k tokens, we send the whole transcript to LLM
  - 8k+ tokens, we chunk the transcript by therapist questions, summarize each chunk via LangChain, and send the summaries to LLM
  */
  async answerQuestion(
    user_id: number,
    transcript_id: number,
    question: string,
  ) {
    const model = this.configService.get<string>('AGENT_LLM2') ?? 'gpt-4-turbo';
    try {
      // Fetch transcript
      console.log('Fetching transcript...');
      const tx = await this.fetchTranscript(transcript_id, user_id);
      let content: string = tx.content;

      // Sanitize transcript content. If we refactor to pre-process transcripts, we could skip this step.
      content = sanitizeTranscriptContent(content);

      const tokenCount = countTokens(tx.content);
      const maxTokens =
        this.configService.get<number>('MAX_SUMMARY_TOKENS') ?? 10000;
      console.log('Token count: ', tokenCount, 'Max tokens: ', maxTokens);

      // If needed, chunk transcript for summarization. For now, we chunk every time the therapist asks a question, signifying a new topic.
      const chunks = chunkTranscript(tx.content, tokenCount, maxTokens);

      // Generate summaries for each chunk. If the call is unsuccessful, return original chunk.
      // TODO: Optimize this by pre-summarizing chunks via LangChain as soon as they are created and storing them in DB
      if (chunks.length > 0) {
        const summaries = await Promise.all(
          chunks.map(async (chunk, i) => {
            try {
              if (i === 2) {
                console.log('Summarizing chunk: ', chunk);
                console.log('Chunk tokens: ', countTokens(chunk));
              }
              const summary = await summarizeChunkWithLangChain(
                chunk,
                this.configService,
              );
              if (i === 2) {
                console.log('Summary: ', summary);
              }
              i++;
              return summary;
            } catch (err) {
              console.error(`Summarization failed for chunk ${i}`, err);
              return '[Summary unavailable]';
            }
          }),
        );
        // Build prompt
        content = summaries.join('\n\n');
      }

      // Pass in session metadata (e.g. session date, patient name, therapist name, etc.)
      const metadata: SessionMetadata = await this.compileMetadata(tx);

      // Fetch Q&A history to pass into LLM context window
      const qaHistory = await fetchQAHistory(user_id, transcript_id, 6); // Last 6 Q&A pairs

      const messages: ChatMessage[] = buildPrompt(
        content,
        metadata,
        question,
        qaHistory,
      );
      console.log('Messages: ', JSON.stringify(messages, null, 2));

      // Send to LLM
      let response: OpenAI.Chat.Completions.ChatCompletion;
      try {
        response = await this.openai.chat.completions.create({
          model: model,
          messages,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new InternalServerErrorException(`LLM error: ${msg}`);
      }

      // 4) Safely extract & trim the content
      const rawContent = response.choices?.[0]?.message?.content as string;
      if (typeof rawContent !== 'string') {
        throw new InternalServerErrorException('No response from LLM');
      }
      const answer = rawContent.trim();

      // Save Q&A history to Redis
      await saveQAHistory(user_id, transcript_id, question, answer);

      // Save to audit log
      const auditLog = await this.saveAuditLog({
        transcript_id,
        question,
        answer,
        model_used: model,
        prompt_snapshot: JSON.stringify(messages),
      });
      console.log('Audit log: ', JSON.stringify(auditLog, null, 2));

      return { answer };
    } catch (err: unknown) {
      // re-throw known HttpExceptions so Nest uses their status code
      if (err instanceof HttpException) {
        throw err;
      }
      // otherwise surface the original error message as a 500
      const msg = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(msg);
    }
  }

  /**
   * Public method for fetching the raw transcript (and, unless onlyTranscript=true, a summary).
   */
  async getTranscript(
    user_id: number,
    transcript_id: number,
    onlyTranscript = false,
  ): Promise<{ transcript: string; summary?: string }> {
    try {
      // Fetch transcript
      const tx: TranscriptRecord = await this.fetchTranscript(
        transcript_id,
        user_id,
      );

      // TODO: Improve this by pre-processing transcripts to avoid real-time chunking, sanitization, and summarization calls to LLM
      // Sanitize content
      const transcript = sanitizeTranscriptContent(tx.content);

      // If needed (<8k tokens), build summary for chunked transcripts
      const maxTokens =
        this.configService.get<number>('MAX_SUMMARY_TOKENS') ?? 8000;
      const tokenCount = countTokens(transcript);

      let summary: string;
      if (tokenCount <= maxTokens) {
        console.log('Summarizing entire transcript in one go');
        summary = await summarizeChunkWithLangChain(
          transcript,
          this.configService,
          true,
        );
      } else {
        console.log('Chunking transcript and summarizing each chunk');
        // chunk + summarize
        const chunks = chunkTranscript(transcript, tokenCount, maxTokens);
        const summaries = await Promise.all(
          chunks.map((chunk, i) =>
            summarizeChunkWithLangChain(chunk, this.configService).catch(
              () => '[Summary unavailable]',
            ),
          ),
        );
        summary = summaries.join('\n\n');
      }

      return { transcript, summary };
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(
        `Failed to fetch transcript: ${msg}`,
      );
    }
  }

  // TODO: Refactor to its own service (something like TranscriptService)
  private async fetchTranscript(
    transcript_id: number,
    user_id: number,
  ): Promise<TranscriptRecord> {
    // Load transcript
    let tx: TranscriptRecord | undefined;
    try {
      tx = await this.db
        .selectFrom('transcripts')
        .selectAll()
        .where('id', '=', transcript_id)
        .executeTakeFirst();
    } catch (err: unknown) {
      // Try to narrow error before logging
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`DB error fetching transcript #${transcript_id}: ${msg}`);
      throw new InternalServerErrorException(
        'Database error fetching transcript',
      );
    }

    if (!tx) {
      throw new NotFoundException(`Transcript #${transcript_id} not found`);
    }

    // Load patient to cross-check with user_id
    let patient: PatientRecord | undefined;
    try {
      patient = await this.db
        .selectFrom('patients')
        .selectAll()
        .where('id', '=', tx.patient_id)
        .executeTakeFirst();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`DB error fetching patient #${tx.patient_id}: ${msg}`);
      throw new InternalServerErrorException('Database error fetching patient');
    }

    if (!patient) {
      // should never happen if FK is correct, but safe‐guard anyway
      throw new NotFoundException(
        `Patient ${tx.patient_id} for transcript ${transcript_id} not found`,
      );
    }

    // Enforce ownership
    if (patient.user_id !== user_id) {
      throw new ForbiddenException(
        `You do not have access to transcript #${transcript_id}`,
      );
    }
    return tx;
  }

  private async compileMetadata(transcript: TranscriptRecord) {
    // Get patient info from DB
    const patient: PatientRecord = await this.db
      .selectFrom('patients')
      .selectAll()
      .where('id', '=', transcript.patient_id)
      .executeTakeFirstOrThrow();

    // Get therapist info from DB
    const therapist: UserRecord = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', patient.user_id)
      .executeTakeFirstOrThrow();

    const sessionMetadata: SessionMetadata = {
      patient_name: `${patient.first_name} ${patient.last_name}`,
      patient_email: patient.email,
      patient_first_session_date: formatDateTime(
        patient.first_session_date.toISOString(),
      ),
      session_date: formatDateTime(transcript.created_at.toISOString()),
      therapist_name: therapist.name,
    };
    return sessionMetadata;
  }

  // Helper function to save audit log
  private async saveAuditLog({
    transcript_id,
    question,
    answer,
    model_used,
    prompt_snapshot,
  }: {
    transcript_id: number;
    question: string;
    answer: string;
    model_used: string;
    prompt_snapshot: string;
  }) {
    return await this.db
      .insertInto('qa_logs')
      .values({
        transcript_id,
        question,
        answer,
        model_used,
        prompt_snapshot,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

export type SessionMetadata = {
  patient_name: string;
  patient_email: string;
  patient_first_session_date: string;
  session_date: string;
  therapist_name: string;
};

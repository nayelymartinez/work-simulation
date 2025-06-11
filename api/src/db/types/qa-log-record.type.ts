export type QALogRecord = {
  id?: number;
  transcript_id: number;
  question: string;
  answer: string;
  model_used: string;
  prompt_snapshot: string;
  created_at: Date;
};

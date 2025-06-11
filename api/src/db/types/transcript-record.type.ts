export type TranscriptRecord = {
  id?: number;
  transcript_uuid: string; // session_id refers to the unique ID for a particular patient's mental health session\
  content: string;
  patient_id: number; // FK to patients table
  created_at: Date;
};

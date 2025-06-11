import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { TranscriptRecord } from './types/transcript-record.type';

import { UserRecord } from './types/user-record.type';
import { PatientRecord } from './types/patient-record.type';
import { QALogRecord } from './types/qa-log-record.type';

export interface Database {
  users: UserRecord;
  patients: PatientRecord;
  transcripts: TranscriptRecord;
  qa_logs: QALogRecord;
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
});

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// scripts/loadTranscript.ts

// To run: docker compose run --rm api npx ts-node scripts/loadTranscript.ts

import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import * as path from 'path';
import { db } from '../src/db/db';

async function main() {
  // Read the transcript file
  const transcriptPath = path.resolve(
    __dirname,
    '../data/transcript-extended.txt',
  );
  const content = readFileSync(transcriptPath, 'utf-8').trim();
  if (!content) {
    console.error('Transcript file is empty or not found at', transcriptPath);
    process.exit(1);
  }

  // Prepare insert values
  const transcriptId = randomUUID();
  const patientId = 2;

  const { id } = await db
    .insertInto('transcripts')
    .values({
      transcript_uuid: transcriptId,
      patient_id: patientId,
      content,
      created_at: new Date(),
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  if (!id) {
    throw new Error('Failed to insert transcript');
  }
  console.log(`Inserted transcript (id=${id}, session_id=${transcriptId})`);
}

main().catch((err) => {
  console.error('Error loading transcript:', err);
  process.exit(1);
});

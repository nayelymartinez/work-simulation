export type PatientRecord = {
  id?: number;
  patient_uuid: string;
  first_name: string;
  last_name: string;
  user_id: number;
  email: string;
  created_at: Date;
  first_session_date: Date;
};

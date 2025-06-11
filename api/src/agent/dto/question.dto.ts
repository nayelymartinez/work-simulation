// DTO for user-submitted question (with class-validator decorators yay!)
import { IsInt, IsString, MinLength, MaxLength } from 'class-validator';

export class QuestionDto {
  @IsInt()
  user_id: number;

  @IsInt()
  transcript_id: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500) // You can adjust this limit
  question: string;
}


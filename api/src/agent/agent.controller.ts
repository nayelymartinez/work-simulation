import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { QuestionDto } from 'src/agent/dto/question.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  // Agent endpoint: POST /agent/question
  @Post('transcript/question')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async question(
    @Body() { user_id, transcript_id, question }: QuestionDto,
  ): Promise<{ answer: string }> {
    return this.agentService.answerQuestion(user_id, transcript_id, question);
  }

  // TODO: Ideally, we would use a JWT/Auth guard to populate the userId. For now, I'm just passing it in as a path param
  /**
   * GET /agent/transcript/:userId/:transcriptId?onlyTranscript=true|false
   *
   * Path param:
   *  - transcriptId: number
   * Query param:
   *  - onlyTranscript: boolean (default: false)
   *
   * If onlyTranscript=true, returns { transcript }.
   * Otherwise returns { transcript, summary }.
   */
  @Get('transcript/:userId/:transcriptId')
  async fetchTranscript(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('transcriptId', ParseIntPipe) transcriptId: number,
    @Query('onlyTranscript', new DefaultValuePipe(false), ParseBoolPipe)
    onlyTranscript: boolean,
  ) {
    return this.agentService.getTranscript(
      userId,
      transcriptId,
      onlyTranscript,
    );
  }
}

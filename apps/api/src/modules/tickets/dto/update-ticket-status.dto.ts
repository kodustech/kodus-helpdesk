import { IsEnum } from 'class-validator';
import { TicketStatus } from '../../../config/enums/ticket-status.enum';

export class UpdateTicketStatusDto {
    @IsEnum(TicketStatus)
    status: TicketStatus;
}

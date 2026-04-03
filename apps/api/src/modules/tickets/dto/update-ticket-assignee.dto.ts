import { IsUUID } from 'class-validator';

export class UpdateTicketAssigneeDto {
    @IsUUID()
    assignee_id: string;
}

import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { TicketCategory } from '../../../config/enums/ticket-category.enum';

export class CreateTicketDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsObject()
    @IsNotEmpty()
    description: Record<string, any>;

    @IsEnum(TicketCategory)
    category: TicketCategory;

    @IsOptional()
    @IsUUID()
    customer_id?: string;
}

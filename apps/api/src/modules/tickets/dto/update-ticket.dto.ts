import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { TicketCategory } from '../../../config/enums/ticket-category.enum';

export class UpdateTicketDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsObject()
    description?: Record<string, any>;

    @IsOptional()
    @IsEnum(TicketCategory)
    category?: TicketCategory;
}

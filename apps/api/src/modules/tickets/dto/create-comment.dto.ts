import { IsArray, IsNotEmpty, IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
    @IsObject()
    @IsNotEmpty()
    content: Record<string, any>;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    mentioned_user_ids?: string[];
}

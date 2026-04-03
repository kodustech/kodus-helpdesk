import { IsArray, IsUUID } from 'class-validator';

export class AddLabelsDto {
    @IsArray()
    @IsUUID('4', { each: true })
    label_ids: string[];
}

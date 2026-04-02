import { IsOptional, IsString } from 'class-validator';

export class UpdateCustomerDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    site?: string;
}

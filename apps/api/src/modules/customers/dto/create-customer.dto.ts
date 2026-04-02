import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    site?: string;

    @IsEmail()
    first_user_email: string;
}

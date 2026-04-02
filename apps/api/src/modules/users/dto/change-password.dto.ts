import { IsString, IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    current_password: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
    new_password: string;

    @IsString()
    confirm_password: string;
}

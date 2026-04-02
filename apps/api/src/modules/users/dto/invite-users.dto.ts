import {
    IsArray,
    IsEmail,
    IsEnum,
    IsOptional,
    IsUUID,
} from 'class-validator';
import { UserRole } from '../../../config/enums';

export class InviteUsersDto {
    @IsArray()
    @IsEmail({}, { each: true })
    emails: string[];

    @IsEnum(UserRole)
    role: UserRole;

    @IsOptional()
    @IsUUID()
    customer_id?: string;
}

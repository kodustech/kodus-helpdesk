import { IsEnum } from 'class-validator';
import { UserRole } from '../../../config/enums';

export class ChangeRoleDto {
    @IsEnum(UserRole)
    role: UserRole;
}

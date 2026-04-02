import {
    Body,
    Controller,
    Headers,
    Post,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('login')
    async login(@Body() dto: LoginDto) {
        const user = await this.authService.validateLocalUser(
            dto.email,
            dto.password,
        );

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        return this.authService.login(user);
    }

    @Public()
    @Post('refresh')
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshToken(dto.refresh_token);
    }

    @Public()
    @Post('cloud')
    async cloudAuth(@Headers('authorization') authorization: string) {
        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing cloud token');
        }

        const token = authorization.replace('Bearer ', '');
        return this.authService.validateCloudToken(token);
    }
}

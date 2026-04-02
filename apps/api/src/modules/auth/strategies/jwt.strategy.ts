import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { UserModel } from '../../users/entities/user.model';
import { UserStatus } from '../../../config/enums';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        @InjectRepository(UserModel)
        private readonly userRepository: Repository<UserModel>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: { uuid: string; email: string; role: string }) {
        const user = await this.userRepository.findOne({
            where: { uuid: payload.uuid },
            relations: ['customer'],
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (user.status === UserStatus.REMOVED) {
            throw new UnauthorizedException('User has been removed');
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new UnauthorizedException('User is not active');
        }

        const { password, ...result } = user;
        return result;
    }
}

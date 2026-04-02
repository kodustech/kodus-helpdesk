import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../users/entities/user.model';
import { AuthTokenModel } from './entities/auth-token.model';
import { UserStatus } from '../../config/enums';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserModel)
        private readonly userRepository: Repository<UserModel>,
        @InjectRepository(AuthTokenModel)
        private readonly authTokenRepository: Repository<AuthTokenModel>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async validateLocalUser(
        email: string,
        password: string,
    ): Promise<UserModel | null> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .leftJoinAndSelect('user.customer', 'customer')
            .where('user.email = :email', { email })
            .getOne();

        if (!user || !user.password) {
            return null;
        }

        if (user.status === UserStatus.REMOVED) {
            return null;
        }

        if (user.status !== UserStatus.ACTIVE) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    async login(user: UserModel) {
        const payload = {
            uuid: user.uuid,
            email: user.email,
            role: user.role,
            customerId: user.customer?.uuid || null,
        };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '15m',
        });

        const refreshToken = uuidv4();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        const authToken = this.authTokenRepository.create({
            refreshToken,
            expiryDate,
            used: false,
            user,
        });
        await this.authTokenRepository.save(authToken);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                uuid: user.uuid,
                email: user.email,
                name: user.name,
                role: user.role,
                customerId: user.customer?.uuid || null,
            },
        };
    }

    async refreshToken(token: string) {
        const authToken = await this.authTokenRepository.findOne({
            where: {
                refreshToken: token,
                used: false,
                expiryDate: MoreThan(new Date()),
            },
            relations: ['user', 'user.customer'],
        });

        if (!authToken) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Mark current token as used
        authToken.used = true;
        await this.authTokenRepository.save(authToken);

        if (authToken.user.status !== UserStatus.ACTIVE) {
            throw new UnauthorizedException('User is not active');
        }

        return this.login(authToken.user);
    }

    async validateCloudToken(token: string) {
        const kodusSecret = this.configService.get<string>('KODUS_JWT_SECRET');

        if (!kodusSecret) {
            throw new UnauthorizedException('Cloud authentication not configured');
        }

        let payload: any;
        try {
            payload = this.jwtService.verify(token, { secret: kodusSecret });
        } catch {
            throw new UnauthorizedException('Invalid cloud token');
        }

        // Find helpdesk user by external UUID
        const user = await this.userRepository.findOne({
            where: { externalUserUuid: payload.uuid },
            relations: ['customer'],
        });

        if (!user) {
            throw new UnauthorizedException(
                'User not mapped in helpdesk. Contact your administrator.',
            );
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new UnauthorizedException('User is not active');
        }

        return this.login(user);
    }
}

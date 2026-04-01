import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ApiModule } from './api.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(ApiModule);

    app.use(helmet());

    app.enableCors({
        origin: true,
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.setGlobalPrefix('api');

    const port = process.env.API_PORT || 3003;
    await app.listen(port);

    console.log(`Helpdesk API running on port ${port}`);
}

bootstrap();

import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (
    configService: ConfigService,
): TypeOrmModuleOptions => {
    const isProduction = configService.get('API_NODE_ENV') === 'production';
    const disableSSL =
        configService.get('API_DATABASE_DISABLE_SSL') === 'true';

    return {
        type: 'postgres',
        host: configService.get('API_PG_DB_HOST', 'localhost'),
        port: configService.get<number>('API_PG_DB_PORT', 5432),
        username: configService.get('API_PG_DB_USERNAME', 'kodus'),
        password: configService.get('API_PG_DB_PASSWORD', 'kodus'),
        database: configService.get('API_PG_DB_DATABASE', 'kodus_db'),
        schema: 'helpdesk',
        synchronize: false,
        migrationsRun: false,
        migrationsTransactionMode: 'each',
        migrationsTableName: 'migrations',
        ssl: isProduction && !disableSSL,
        entities: [__dirname + '/../../**/*.model{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
            max: 30,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 60000,
            keepAlive: true,
        },
    };
};

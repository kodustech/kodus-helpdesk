import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
    type: 'postgres',
    host: process.env.API_PG_DB_HOST || 'localhost',
    port: parseInt(process.env.API_PG_DB_PORT || '5432'),
    username: process.env.API_PG_DB_USERNAME || 'kodus',
    password: process.env.API_PG_DB_PASSWORD || 'kodus',
    database: process.env.API_PG_DB_DATABASE || 'kodus_db',
    schema: 'helpdesk',
    synchronize: false,
    migrationsRun: false,
    migrationsTransactionMode: 'each',
    migrationsTableName: 'migrations',
    entities: [__dirname + '/../../**/*.model{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
});

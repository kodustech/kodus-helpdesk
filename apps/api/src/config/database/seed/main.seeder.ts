import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config({ override: false });

async function runSeeder() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.API_PG_DB_HOST || 'localhost',
        port: parseInt(process.env.API_PG_DB_PORT || '5432'),
        username: process.env.API_PG_DB_USERNAME || 'kodus',
        password: process.env.API_PG_DB_PASSWORD || 'kodus',
        database: process.env.API_PG_DB_DATABASE || 'kodus_db',
        schema: 'helpdesk',
    });

    await dataSource.initialize();

    // Ensure helpdesk schema exists
    await dataSource.query(`CREATE SCHEMA IF NOT EXISTS helpdesk`);

    // Seed owner user
    const existingOwner = await dataSource.query(
        `SELECT uuid FROM helpdesk.users WHERE email = $1`,
        ['admin@kodus.io'],
    );

    if (existingOwner.length === 0) {
        const hashedPassword = await bcrypt.hash('Admin#00', 10);

        await dataSource.query(
            `INSERT INTO helpdesk.users (email, password, name, role, status, auth_type)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'admin@kodus.io',
                hashedPassword,
                'Admin',
                'owner',
                'active',
                'local',
            ],
        );

        console.log('Owner user created: admin@kodus.io');
    } else {
        console.log('Owner user already exists, skipping seed');
    }

    console.log('Seed completed successfully');
    await dataSource.destroy();
}

runSeeder().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
});

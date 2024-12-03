import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.PG_USERNAME,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

export default pool;
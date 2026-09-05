import { drizzle } from 'drizzle-orm/node-postgres';
import { pool } from '../config/db.js';
import * as schema from '../drizzle/schema.js';
import * as relations from '../drizzle/relations.js';

export const db = drizzle(pool, { schema: { ...schema, ...relations } });
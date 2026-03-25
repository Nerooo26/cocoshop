import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const required = (name: string) => {
  const v = process.env[name];
  if (v === undefined) throw new Error(`Missing environment variable: ${name}`);
  return v;
};

export const pool = mysql.createPool({
  host: required('DB_HOST'),
  user: required('DB_USER'),
  password: process.env.DB_PASSWORD ?? "",   // allow empty
  database: required('DB_NAME'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
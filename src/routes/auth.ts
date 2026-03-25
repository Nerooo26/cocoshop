import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const bodySchema = z
    .object({
      email: z.string().email(),
      password: z.string().min(6),
      confirmPassword: z.string().min(6),
      completeName: z.string().min(1),
      address: z.string().min(1),
      mobileNumber: z.string().min(1),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const { email, password, completeName, address, mobileNumber } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const existing = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (Array.isArray(existing[0]) && (existing[0] as any[]).length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, role, complete_name, address, mobile_number) VALUES (?, ?, ?, ?, ?, ?)',
      [email, passwordHash, 'buyer', completeName, address, mobileNumber],
    );

    const userId = (result as any).insertId as number;
    await pool.execute('INSERT INTO carts (buyer_id) VALUES (?)', [userId]);

    return res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  const bodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const { email, password } = parsed.data;
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, password_hash, role, complete_name, address, mobile_number FROM users WHERE email = ? LIMIT 1',
      [email],
    );
    const user = (rows as any[])[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: 'JWT secret not configured' });

    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '7d' });
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        completeName: user.complete_name,
        address: user.address,
        mobileNumber: user.mobile_number,
      },
    });
  } catch {
    return res.status(500).json({ message: 'Login failed' });
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: 'Missing user context' });

  try {
    const [rows] = await pool.execute(
      'SELECT id, email, role, complete_name, address, mobile_number FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    const user = (rows as any[])[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      completeName: user.complete_name,
      address: user.address,
      mobileNumber: user.mobile_number,
    });
  } catch {
    return res.status(500).json({ message: 'Failed to load profile' });
  }
});

authRouter.patch('/me', requireAuth, requireRole('buyer'), async (req, res) => {
  const schema = z.object({
    completeName: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    mobileNumber: z.string().min(1).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: 'Missing user context' });

  const { completeName, address, mobileNumber } = parsed.data;
  if (!completeName && !address && !mobileNumber) return res.status(400).json({ message: 'No fields to update' });

  try {
    await pool.execute(
      'UPDATE users SET complete_name = COALESCE(?, complete_name), address = COALESCE(?, address), mobile_number = COALESCE(?, mobile_number) WHERE id = ?',
      [completeName ?? null, address ?? null, mobileNumber ?? null, userId],
    );
    return res.json({ message: 'Profile updated' });
  } catch {
    return res.status(500).json({ message: 'Update failed' });
  }
});


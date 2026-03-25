import { Router } from 'express';
import { pool } from '../db';

export const productsRouter = Router();

productsRouter.get('/', async (_req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, description, price, image_url FROM products WHERE status = "active" ORDER BY id DESC',
  );
  return res.json({ products: rows });
});

productsRouter.get('/storefront', async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT fp.tag, p.id, p.name, p.description, p.price, p.image_url
     FROM featured_products fp
     INNER JOIN products p ON p.id = fp.product_id
     WHERE fp.enabled = 1 AND p.status = "active"`,
  );

  const grouped: Record<string, any[]> = { new: [], trending: [], best_seller: [] };
  for (const r of rows as any[]) {
    if (!grouped[r.tag]) grouped[r.tag] = [];
    grouped[r.tag]!.push(r);
  }

  return res.json({ featured: grouped });
});


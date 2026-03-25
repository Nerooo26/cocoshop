import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

export const sellerRouter = Router();

sellerRouter.use(requireAuth, requireRole('seller'));

sellerRouter.get('/storefront', async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.name, p.image_url,
            MAX(CASE WHEN fp.tag = "new" THEN 1 ELSE 0 END) AS is_new,
            MAX(CASE WHEN fp.tag = "trending" THEN 1 ELSE 0 END) AS is_trending,
            MAX(CASE WHEN fp.tag = "best_seller" THEN 1 ELSE 0 END) AS is_best_seller
     FROM products p
     LEFT JOIN featured_products fp
       ON fp.product_id = p.id AND fp.enabled = 1 AND fp.tag IN ("new","trending","best_seller")
     WHERE p.status = "active"
     GROUP BY p.id, p.name, p.image_url`,
  );
  return res.json({ products: rows });
});

sellerRouter.put('/storefront', async (req, res) => {
  const schema = z.object({
    new: z.array(z.number().int().positive()),
    trending: z.array(z.number().int().positive()),
    best_seller: z.array(z.number().int().positive()),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `DELETE FROM featured_products WHERE tag IN ("new","trending","best_seller") AND enabled = 1`,
    );

    const toInsert: Array<{ tag: string; productId: number }> = [];
    for (const id of parsed.data.new) toInsert.push({ tag: 'new', productId: id });
    for (const id of parsed.data.trending) toInsert.push({ tag: 'trending', productId: id });
    for (const id of parsed.data.best_seller) toInsert.push({ tag: 'best_seller', productId: id });

    for (const item of toInsert) {
      // Ensure product exists and is active
      const [prodRows] = await conn.execute('SELECT id FROM products WHERE id = ? AND status = "active" LIMIT 1', [
        item.productId,
      ]);
      if (!(prodRows as any[])[0]) {
        await conn.rollback();
        return res.status(400).json({ message: `Invalid product id for tag ${item.tag}` });
      }

      await conn.execute(
        `INSERT INTO featured_products (product_id, tag, enabled)
         VALUES (?, ?, 1)`,
        [item.productId, item.tag],
      );
    }

    await conn.commit();
    return res.json({ message: 'Storefront updated' });
  } catch {
    try {
      await conn.rollback();
    } catch {
      // ignore
    }
    return res.status(500).json({ message: 'Failed to update storefront' });
  } finally {
    conn.release();
  }
});

sellerRouter.get('/inventory', async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT p.id,
            p.name,
            p.description,
            p.price,
            p.image_url,
            p.status,
            COALESCE(inv.stock_quantity, 0) AS stock_quantity
     FROM products p
     LEFT JOIN inventory inv ON inv.product_id = p.id
     WHERE p.status IN ("active","inactive")
     ORDER BY p.id DESC`,
  );
  return res.json({ products: rows });
});

sellerRouter.post('/products', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    price: z.number().nonnegative(),
    imageUrl: z.string().url(),
    stockQuantity: z.number().int().nonnegative(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const { name, description, price, imageUrl, stockQuantity } = parsed.data;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [prod] = await conn.execute(
      `INSERT INTO products (name, description, price, image_url, status)
       VALUES (?, ?, ?, ?, "active")`,
      [name, description, price, imageUrl],
    );
    const productId = (prod as any).insertId as number;
    await conn.execute(
      `INSERT INTO inventory (product_id, stock_quantity, updated_at) VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), updated_at = NOW()`,
      [productId, stockQuantity],
    );
    await conn.commit();
    return res.status(201).json({ message: 'Product created', productId });
  } catch {
    try {
      await conn.rollback();
    } catch {
      // ignore
    }
    return res.status(500).json({ message: 'Failed to create product' });
  } finally {
    conn.release();
  }
});

sellerRouter.put('/products/:id', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    price: z.number().nonnegative().optional(),
    imageUrl: z.string().url().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const productId = Number(req.params.id);
  if (!Number.isFinite(productId)) return res.status(400).json({ message: 'Invalid product id' });

  const fields = parsed.data;
  if (!fields.name && !fields.description && fields.price === undefined && !fields.imageUrl && !fields.status) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  await pool.execute(
    `UPDATE products
     SET name = COALESCE(?, name),
         description = COALESCE(?, description),
         price = COALESCE(?, price),
         image_url = COALESCE(?, image_url),
         status = COALESCE(?, status)
     WHERE id = ?`,
    [fields.name ?? null, fields.description ?? null, fields.price ?? null, fields.imageUrl ?? null, fields.status ?? null, productId],
  );

  return res.json({ message: 'Product updated' });
});

sellerRouter.delete('/products/:id', async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isFinite(productId)) return res.status(400).json({ message: 'Invalid product id' });

  await pool.execute('UPDATE products SET status = "inactive" WHERE id = ?', [productId]);
  await pool.execute('DELETE FROM featured_products WHERE product_id = ?', [productId]);
  return res.json({ message: 'Product deactivated' });
});

sellerRouter.put('/inventory/:productId', async (req, res) => {
  const schema = z.object({ stockQuantity: z.number().int().nonnegative() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });
  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId)) return res.status(400).json({ message: 'Invalid product id' });

  await pool.execute(
    `INSERT INTO inventory (product_id, stock_quantity, updated_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), updated_at = NOW()`,
    [productId, parsed.data.stockQuantity],
  );

  return res.json({ message: 'Inventory updated' });
});

sellerRouter.get('/reports/day', async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT COALESCE(SUM(total_amount), 0) AS total
     FROM orders
     WHERE order_status = "paid" AND DATE(created_at) = CURDATE()`,
  );
  return res.json({ total: (rows as any[])[0]?.total ?? 0 });
});

sellerRouter.get('/reports/month', async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT COALESCE(SUM(total_amount), 0) AS total
     FROM orders
     WHERE order_status = "paid"
       AND YEAR(created_at) = YEAR(CURDATE())
       AND MONTH(created_at) = MONTH(CURDATE())`,
  );
  return res.json({ total: (rows as any[])[0]?.total ?? 0 });
});

sellerRouter.get('/inventory-report', async (req, res) => {
  const threshold = req.query.threshold ? Number(req.query.threshold) : 5;
  const th = Number.isFinite(threshold) ? threshold : 5;

  const [rows] = await pool.execute(
    `SELECT p.id, p.name, p.image_url, COALESCE(inv.stock_quantity, 0) AS stock_quantity
     FROM products p
     LEFT JOIN inventory inv ON inv.product_id = p.id
     WHERE p.status = "active"
     ORDER BY stock_quantity ASC`,
  );

  const lowStock = (rows as any[]).filter((r) => Number(r.stock_quantity) <= th);
  return res.json({ threshold: th, lowStock, all: rows });
});


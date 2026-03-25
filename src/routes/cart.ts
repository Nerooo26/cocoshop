import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

export const cartRouter = Router();

cartRouter.get('/cart', requireAuth, requireRole('buyer'), async (req, res) => {
  const buyerId = req.user?.userId;
  if (!buyerId) return res.status(401).json({ message: 'Missing user context' });

  const [rows] = await pool.execute(
    `SELECT ci.id, ci.product_id, p.name, p.price, p.image_url, ci.quantity
     FROM carts c
     INNER JOIN cart_items ci ON ci.cart_id = c.id
     INNER JOIN products p ON p.id = ci.product_id
     WHERE c.buyer_id = ? AND p.status = "active"`,
    [buyerId],
  );

  return res.json({ items: rows });
});

cartRouter.post('/cart/items', requireAuth, requireRole('buyer'), async (req, res) => {
  const schema = z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const buyerId = req.user?.userId;
  if (!buyerId) return res.status(401).json({ message: 'Missing user context' });

  const { productId, quantity } = parsed.data;

  try {
    const [cartRows] = await pool.execute('SELECT id FROM carts WHERE buyer_id = ? LIMIT 1', [buyerId]);
    let cartId = (cartRows as any[])[0]?.id as number | undefined;
    if (!cartId) {
      const [ins] = await pool.execute('INSERT INTO carts (buyer_id) VALUES (?)', [buyerId]);
      cartId = (ins as any).insertId as number;
    }

    // Optional stock cap (server-side validation during checkout will still be authoritative)
    const [invRows] = await pool.execute('SELECT stock_quantity FROM inventory WHERE product_id = ? LIMIT 1', [
      productId,
    ]);
    const stock = (invRows as any[])[0]?.stock_quantity as number | undefined;
    if (typeof stock === 'number' && quantity > stock) {
      return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
    }

    await pool.execute(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
      [cartId, productId, quantity],
    );

    return res.json({ message: 'Cart updated' });
  } catch {
    return res.status(500).json({ message: 'Failed to update cart' });
  }
});

cartRouter.patch('/cart/items/:id', requireAuth, requireRole('buyer'), async (req, res) => {
  const schema = z.object({
    quantity: z.number().int().positive(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const buyerId = req.user?.userId;
  if (!buyerId) return res.status(401).json({ message: 'Missing user context' });

  const itemId = Number(req.params.id);
  if (!Number.isFinite(itemId)) return res.status(400).json({ message: 'Invalid cart item id' });

  const { quantity } = parsed.data;

  const [cartRows] = await pool.execute('SELECT id FROM carts WHERE buyer_id = ? LIMIT 1', [buyerId]);
  const cartId = (cartRows as any[])[0]?.id as number | undefined;
  if (!cartId) return res.status(404).json({ message: 'Cart not found' });

  await pool.execute('UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?', [
    quantity,
    itemId,
    cartId,
  ]);
  return res.json({ message: 'Cart item updated' });
});

cartRouter.delete('/cart/items/:id', requireAuth, requireRole('buyer'), async (req, res) => {
  const buyerId = req.user?.userId;
  if (!buyerId) return res.status(401).json({ message: 'Missing user context' });

  const itemId = Number(req.params.id);
  if (!Number.isFinite(itemId)) return res.status(400).json({ message: 'Invalid cart item id' });

  const [cartRows] = await pool.execute('SELECT id FROM carts WHERE buyer_id = ? LIMIT 1', [buyerId]);
  const cartId = (cartRows as any[])[0]?.id as number | undefined;
  if (!cartId) return res.status(404).json({ message: 'Cart not found' });

  await pool.execute('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [itemId, cartId]);
  return res.json({ message: 'Cart item removed' });
});


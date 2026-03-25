import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

export const ordersRouter = Router();

ordersRouter.post('/checkout', requireAuth, requireRole('buyer'), async (req, res) => {
  const schema = z.object({
    paymentMethod: z.string().min(1),
    fulfillmentMethod: z.enum(['pickup', 'delivery']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.flatten() });

  const buyerId = req.user?.userId;
  if (!buyerId) return res.status(401).json({ message: 'Missing user context' });

  const { paymentMethod, fulfillmentMethod } = parsed.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [cartRows] = await conn.execute(
      `SELECT ci.product_id, ci.quantity, p.price AS unit_price, inv.stock_quantity
       FROM carts c
       INNER JOIN cart_items ci ON ci.cart_id = c.id
       INNER JOIN products p ON p.id = ci.product_id
       INNER JOIN inventory inv ON inv.product_id = p.id
       WHERE c.buyer_id = ? AND p.status = "active"`,
      [buyerId],
    );
    const items = cartRows as any[];

    if (!items.length) {
      await conn.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    for (const it of items) {
      if (it.quantity > it.stock_quantity) {
        await conn.rollback();
        return res.status(400).json({ message: `Insufficient stock for product ${it.product_id}` });
      }
    }

    const totalAmount = items.reduce((sum, it) => sum + Number(it.unit_price) * Number(it.quantity), 0);

    const [orderResult] = await conn.execute(
      `INSERT INTO orders (buyer_id, payment_method, fulfillment_method, total_amount, order_status)
       VALUES (?, ?, ?, ?, ?)`,
      [buyerId, paymentMethod, fulfillmentMethod, totalAmount, 'paid'],
    );

    const orderId = (orderResult as any).insertId as number;

    for (const it of items) {
      const lineTotal = Number(it.unit_price) * Number(it.quantity);
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, it.product_id, it.unit_price, it.quantity, lineTotal],
      );

      const [upd] = await conn.execute(
        `UPDATE inventory SET stock_quantity = stock_quantity - ?
         WHERE product_id = ? AND stock_quantity >= ?`,
        [it.quantity, it.product_id, it.quantity],
      );
      const affected = (upd as any).affectedRows as number;
      if (affected !== 1) {
        await conn.rollback();
        return res.status(400).json({ message: `Stock update failed for product ${it.product_id}` });
      }
    }

    // Clear cart after successful order creation
    await conn.execute(`DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE buyer_id = ? LIMIT 1)`, [
      buyerId,
    ]);

    await conn.commit();
    return res.status(201).json({
      message: 'Checkout successful',
      order: { orderId, totalAmount, fulfillmentMethod, paymentMethod },
    });
  } catch {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback errors
    }
    return res.status(500).json({ message: 'Checkout failed' });
  } finally {
    conn.release();
  }
});

ordersRouter.get('/transactions', requireAuth, requireRole('buyer'), async (req, res) => {
  const buyerId = req.user?.userId;
  if (!buyerId) return res.status(401).json({ message: 'Missing user context' });

  const [rows] = await pool.execute(
    `SELECT o.id AS order_id,
            o.payment_method,
            o.fulfillment_method,
            o.total_amount,
            o.order_status,
            o.created_at,
            oi.product_id,
            p.name AS product_name,
            p.image_url,
            oi.unit_price,
            oi.quantity,
            oi.line_total
     FROM orders o
     INNER JOIN order_items oi ON oi.order_id = o.id
     INNER JOIN products p ON p.id = oi.product_id
     WHERE o.buyer_id = ?
     ORDER BY o.created_at DESC`,
    [buyerId],
  );

  const map = new Map<number, any>();
  for (const r of rows as any[]) {
    if (!map.has(r.order_id)) {
      map.set(r.order_id, {
        orderId: r.order_id,
        paymentMethod: r.payment_method,
        fulfillmentMethod: r.fulfillment_method,
        totalAmount: Number(r.total_amount),
        orderStatus: r.order_status,
        createdAt: r.created_at,
        items: [],
      });
    }
    map.get(r.order_id).items.push({
      productId: r.product_id,
      productName: r.product_name,
      imageUrl: r.image_url,
      unitPrice: Number(r.unit_price),
      quantity: r.quantity,
      lineTotal: Number(r.line_total),
    });
  }

  return res.json({ transactions: Array.from(map.values()) });
});


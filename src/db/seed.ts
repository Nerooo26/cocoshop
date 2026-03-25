import bcrypt from 'bcrypt';
import { pool } from '../db';

const SELLER_EMAIL = 'seller@cybercoco.com';
const SELLER_PASSWORD = 'seller123';

const ADMIN_EMAIL = 'admin@cybercoco.com';
const ADMIN_PASSWORD = 'admin123';

const PRODUCTS: Array<{
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stockQuantity: number;
  featuredTags: Array<'new' | 'trending' | 'best_seller'>;
}> = [
  {
    name: 'Coconut Coir Bricks (Construction Grade)',
    description: 'Eco-friendly coir bricks ideal for construction and soil stabilization.',
    price: 149.0,
    imageUrl: 'https://source.unsplash.com/featured/800x600/?coconut,coir,brick',
    stockQuantity: 50,
    featuredTags: ['new', 'trending'],
  },
  {
    name: 'Coir Grow Bag (Breathable Gardening)',
    description: 'Durable grow bags for vegetables and ornamentals with excellent aeration.',
    price: 89.0,
    imageUrl: 'https://source.unsplash.com/featured/800x600/?growbag,coconut,coir',
    stockQuantity: 120,
    featuredTags: ['best_seller'],
  },
  {
    name: 'Coconut Coir Fiber Mat (Landscaping)',
    description: 'Natural coir fiber mat to help with erosion control and moisture retention.',
    price: 159.0,
    imageUrl: 'https://source.unsplash.com/featured/800x600/?landscaping,coir,fiber,mat',
    stockQuantity: 35,
    featuredTags: ['trending'],
  },
  {
    name: 'Coir Potting Amendment (Soil Conditioner)',
    description: 'Improve soil structure and water-holding capacity with coconut coir amendment.',
    price: 59.0,
    imageUrl: 'https://source.unsplash.com/featured/800x600/?soil,coir,coconut,amendment',
    stockQuantity: 200,
    featuredTags: ['new', 'best_seller'],
  },
  {
    name: 'Coconut Coir Rope (Tying & Binding)',
    description: 'Strong natural coir rope for bundling plants, crafts, and general tying needs.',
    price: 39.0,
    imageUrl: 'https://source.unsplash.com/featured/800x600/?coconut,coir,rope',
    stockQuantity: 300,
    featuredTags: [],
  },
  {
    name: 'Coir Seedling Starter Tray',
    description: 'Biodegradable seedling tray for easy transplanting and healthy root growth.',
    price: 129.0,
    imageUrl: 'https://source.unsplash.com/featured/800x600/?seedling,coir,coconut',
    stockQuantity: 60,
    featuredTags: ['new'],
  },
];

async function seed() {
  // Seller account should exist even if products already exist.
  const [sellerRows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [SELLER_EMAIL]);
  const sellerExists = (sellerRows as any[]).length > 0;

  if (!sellerExists) {
    const passwordHash = await bcrypt.hash(SELLER_PASSWORD, 10);
    await pool.execute(
      `INSERT INTO users (email, password_hash, role, complete_name, address, mobile_number)
       VALUES (?, ?, 'seller', ?, ?, ?)`,
      [SELLER_EMAIL, passwordHash, 'CyberCoco Seller', 'Philippines', '09123456789'],
    );
    // eslint-disable-next-line no-console
    console.log('Inserted seller user.');
  }

  // Admin account should exist even if products already exist.
  const [adminRows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [ADMIN_EMAIL]);
  const adminExists = (adminRows as any[]).length > 0;

  if (!adminExists) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.execute(
      `INSERT INTO users (email, password_hash, role, complete_name, address, mobile_number)
       VALUES (?, ?, 'admin', ?, ?, ?)`,
      [ADMIN_EMAIL, passwordHash, 'CyberCoco Admin', 'Admin Address', '09120000000'],
    );
    // eslint-disable-next-line no-console
    console.log('Inserted admin user.');
  }

  const [productCountRows] = await pool.execute('SELECT COUNT(*) as cnt FROM products');
  const count = Number((productCountRows as any[])[0]?.cnt ?? 0);
  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log('Products already exist; skipping product seed.');
    return;
  }

  for (const p of PRODUCTS) {
    const [prod] = await pool.execute(
      `INSERT INTO products (name, description, price, image_url, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [p.name, p.description, p.price, p.imageUrl],
    );
    const productId = (prod as any).insertId as number;
    await pool.execute(
      `INSERT INTO inventory (product_id, stock_quantity, updated_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), updated_at = NOW()`,
      [productId, p.stockQuantity],
    );

    for (const tag of p.featuredTags) {
      await pool.execute(
        `INSERT INTO featured_products (product_id, tag, enabled) VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE enabled = 1`,
        [productId, tag],
      );
    }
  }

  // eslint-disable-next-line no-console
  console.log('Seeded products, inventory, and featured tags.');
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });


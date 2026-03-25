import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';
import { cartRouter } from './routes/cart';
import { ordersRouter } from './routes/orders';
import { sellerRouter } from './routes/seller';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Serve local product images (so DB image_url can be `/images/<file>`)
const imagesDir = process.env.IMAGES_DIR
  ? path.resolve(process.cwd(), process.env.IMAGES_DIR)
  : path.join(process.cwd(), 'images');
app.use('/images', express.static(imagesDir));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api', cartRouter);
app.use('/api', ordersRouter);
app.use('/api/seller', sellerRouter);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

app.listen(process.env.PORT ? Number(process.env.PORT) : 4000, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${process.env.PORT ? Number(process.env.PORT) : 4000}`);
});


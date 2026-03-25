import { readdir } from 'fs/promises';
import path from 'path';
import { pool } from '../db';

const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

function normalizeForMatch(input: string) {
  return input
    .toLowerCase()
    .trim()
    // Keep only letters/numbers; collapse everything else into spaces.
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');
}

async function main() {
  const imagesDir = process.env.IMAGES_DIR
    ? path.resolve(process.cwd(), process.env.IMAGES_DIR)
    : path.join(process.cwd(), 'images');

  const imageBaseUrl = process.env.IMAGES_BASE_URL ?? '/images';

  const filenames = await readdir(imagesDir);
  const imageFiles = filenames.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED_EXTENSIONS.has(ext);
  });

  const imageEntries = imageFiles.map((filename) => {
    const base = path.parse(filename).name;
    const key = normalizeForMatch(base);
    const tokens = key ? key.split(' ') : [];
    return { filename, key, tokens };
  });

  const [rows] = await pool.execute('SELECT id, name, image_url FROM products');
  const products = rows as any[];

  let matchedCount = 0;
  let skippedCount = 0;
  let missingCount = 0;

  for (const p of products) {
    const productId = p.id as number;
    const productName = String(p.name ?? '');
    const currentImageUrl = p.image_url as string | null;

    const normalizedName = normalizeForMatch(productName);
    const nameTokens = normalizedName ? normalizedName.split(' ') : [];

    // Score each image by token overlap (and exact/substring matches as bonuses).
    // This lets filenames be short (e.g. `Bricks.png`) while DB product names are longer.
    let best: { filename: string; score: number; tokenCount: number } | null = null;
    let bestTie = false;

    for (const img of imageEntries) {
      if (!img.key) continue;

      let score = 0;
      if (normalizedName === img.key) score = 100;
      else {
        const nameIncludesKey = normalizedName.includes(img.key);
        const keyIncludesName = img.key.includes(normalizedName);
        if (nameIncludesKey && img.tokens.length > 0) score += 20;
        if (keyIncludesName && nameTokens.length > 0) score += 10;

        const tokenSet = new Set(nameTokens);
        let overlap = 0;
        for (const t of img.tokens) {
          if (tokenSet.has(t)) overlap += 1;
        }
        score += overlap;
      }

      const tokenCount = img.tokens.length;
      if (!best || score > best.score || (score === best.score && tokenCount > best.tokenCount)) {
        best = { filename: img.filename, score, tokenCount };
        bestTie = false;
      } else if (best && score === best.score && tokenCount === best.tokenCount) {
        bestTie = true;
      }
    }

    if (!best || best.score <= 0 || bestTie) {
      missingCount += 1;
      // eslint-disable-next-line no-console
      console.warn(
        bestTie
          ? `Ambiguous image match for product: ${productName}`
          : `No image match for product: ${productName}`,
      );
      continue;
    }

    const nextImageUrl = `${imageBaseUrl}/${best.filename}`;
    if (currentImageUrl === nextImageUrl) {
      skippedCount += 1;
      continue;
    }

    await pool.execute('UPDATE products SET image_url = ? WHERE id = ?', [nextImageUrl, productId]);
    matchedCount += 1;
  }

  // eslint-disable-next-line no-console
  console.log(
    `Image import done. Updated=${matchedCount} Skipped=${skippedCount} Missing=${missingCount} ImagesDir=${imagesDir}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });


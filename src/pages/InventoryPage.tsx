import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

type InventoryRow = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  status: 'active' | 'inactive';
  stock_quantity: number;
};

export function InventoryPage() {
  const [products, setProducts] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('0');
  const [imageUrl, setImageUrl] = useState('');
  const [stockQuantity, setStockQuantity] = useState<string>('0');

  const [stockDrafts, setStockDrafts] = useState<Record<number, number>>({});

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await api.get('/seller/inventory');
      const rows = r.data.products ?? [];
      setProducts(rows);

      const drafts: Record<number, number> = {};
      for (const row of rows) drafts[row.id] = Number(row.stock_quantity ?? 0);
      setStockDrafts(drafts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalProducts = useMemo(() => products.length, [products]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const priceNum = Number(price);
    const stockNum = Number(stockQuantity);
    if (!imageUrl.trim().length) {
      setMessage('Please provide an image URL.');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setMessage('Price must be a non-negative number.');
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      setMessage('Stock quantity must be a non-negative integer.');
      return;
    }

    await api.post('/seller/products', {
      name,
      description,
      price: priceNum,
      imageUrl,
      stockQuantity: Math.floor(stockNum),
    });

    setName('');
    setDescription('');
    setPrice('0');
    setImageUrl('');
    setStockQuantity('0');
    await refresh();
    setMessage('Product created.');
  };

  const updateStock = async (productId: number) => {
    setMessage(null);
    const next = stockDrafts[productId];
    await api.put(`/seller/inventory/${productId}`, { stockQuantity: Math.floor(next) });
    await refresh();
    setMessage('Stock updated.');
  };

  const deactivate = async (productId: number) => {
    setMessage(null);
    if (!confirm('Deactivate this product?')) return;
    await api.delete(`/seller/products/${productId}`);
    await refresh();
    setMessage('Product deactivated.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-left">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Inventory</h1>
      <p className="mt-2 text-gray-600">Manage products and stock quantities.</p>

      {message ? <div className="mt-4 text-sm text-emerald-700">{message}</div> : null}

      <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-gray-900">Add New Product</div>
            <div className="text-sm text-gray-600">Total products: {totalProducts}</div>
          </div>
          <div className="text-sm text-gray-600">Required: name, description, price, image URL, stock</div>
        </div>

        <form onSubmit={onCreate} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none"
            required
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price (e.g., 199.00)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none md:col-span-2"
            required
          />
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (must be a valid URL)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none md:col-span-2"
            type="url"
            required
          />
          <input
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            placeholder="Stock quantity"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none md:col-span-1"
            required
          />

          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-white text-sm hover:bg-emerald-700 md:col-span-1"
          >
            Create product
          </button>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Current Products</h2>
        {loading ? (
          <div className="mt-4 text-gray-600">Loading...</div>
        ) : (
          <div className="mt-4 space-y-4">
            {products.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-lg p-4 bg-white flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-600">₱{Number(p.price).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Status: {p.status}</div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={stockDrafts[p.id] ?? p.stock_quantity ?? 0}
                    onChange={(e) =>
                      setStockDrafts((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))
                    }
                    className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none"
                  />
                  <button
                    onClick={() => updateStock(p.id)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Update stock
                  </button>
                  <button
                    onClick={() => deactivate(p.id)}
                    className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


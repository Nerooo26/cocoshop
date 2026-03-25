import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

type CartItem = {
  id: number;
  product_id: number;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

export function CartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await api.get('/cart');
      setItems(r.data.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(() => items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0), [items]);

  const updateQty = async (itemId: number, nextQty: number) => {
    if (!Number.isFinite(nextQty) || nextQty <= 0) return;
    await api.patch(`/cart/items/${itemId}`, { quantity: nextQty });
    await refresh();
  };

  const removeItem = async (itemId: number) => {
    await api.delete(`/cart/items/${itemId}`);
    await refresh();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-left">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Your Cart</h1>
      <p className="mt-2 text-gray-600">Review items before checkout.</p>

      {loading ? (
        <div className="mt-8 text-gray-600">Loading...</div>
      ) : items.length === 0 ? (
        <div className="mt-8 text-gray-600">Your cart is empty.</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4">
          {items.map((it) => (
            <div key={it.id} className="border border-gray-200 rounded-lg p-4 bg-white flex gap-4">
              <div className="w-24 h-24 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                {it.image_url ? (
                  <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                )}
              </div>

              <div className="flex-1">
                <div className="font-semibold">{it.name}</div>
                <div className="text-sm text-gray-600 mt-1">₱{Number(it.price).toFixed(2)}</div>

                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm text-gray-700">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, quantity: Number(e.target.value) } : p)))}
                    className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none"
                  />
                  <button
                    onClick={() => updateQty(it.id, it.quantity)}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-600">Line total</div>
                <div className="font-semibold mt-1">₱{(Number(it.price) * Number(it.quantity)).toFixed(2)}</div>
              </div>
            </div>
          ))}

          <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900">Total: ₱{total.toFixed(2)}</div>
            <button
              onClick={() => navigate('/checkout')}
              className="rounded-md bg-emerald-600 px-4 py-2 text-white text-sm hover:bg-emerald-700"
            >
              Proceed to checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


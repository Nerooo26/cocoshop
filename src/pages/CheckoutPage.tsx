import type { FormEvent } from 'react';
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

export function CheckoutPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'pickup' | 'delivery'>('delivery');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!items.length) {
      setError('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/checkout', { paymentMethod, fulfillmentMethod });
      navigate('/transactions');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-left">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Checkout</h1>
      <p className="mt-2 text-gray-600">Choose payment and fulfillment options.</p>

      {loading ? (
        <div className="mt-8 text-gray-600">Loading...</div>
      ) : items.length === 0 ? (
        <div className="mt-8 text-gray-600">Your cart is empty. Add items first.</div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h2 className="font-semibold text-gray-900">Payment Method</h2>
              <div className="mt-3 space-y-2">
                {['Cash on Delivery', 'GCash', 'Card'].map((pm) => (
                  <label key={pm} className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={pm}
                      checked={paymentMethod === pm}
                      onChange={() => setPaymentMethod(pm)}
                    />
                    {pm}
                  </label>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h2 className="font-semibold text-gray-900">Receive Your Order</h2>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="fulfillmentMethod"
                    value="pickup"
                    checked={fulfillmentMethod === 'pickup'}
                    onChange={() => setFulfillmentMethod('pickup')}
                  />
                  Pickup
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="fulfillmentMethod"
                    value="delivery"
                    checked={fulfillmentMethod === 'delivery'}
                    onChange={() => setFulfillmentMethod('delivery')}
                  />
                  Delivery
                </label>
              </div>
            </div>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h2 className="font-semibold text-gray-900">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">{it.name}</span>
                  <span>
                    {it.quantity} x ₱{Number(it.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-gray-200 pt-4 flex items-center justify-between">
              <div className="text-gray-600">Total</div>
              <div className="font-semibold text-gray-900">₱{total.toFixed(2)}</div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-md bg-emerald-600 px-3 py-2 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? 'Placing order...' : 'Place order'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


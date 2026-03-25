import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type FeaturedProductRow = {
  id: number;
  name: string;
  image_url: string | null;
  is_new: 0 | 1;
  is_trending: 0 | 1;
  is_best_seller: 0 | 1;
};

export function StorefrontEditorPage() {
  const [products, setProducts] = useState<FeaturedProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/seller/storefront')
      .then((r) => setProducts(r.data.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (productId: number, key: 'is_new' | 'is_trending' | 'is_best_seller') => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [key]: p[key] ? 0 : 1 } : p)),
    );
  };

  const onSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        new: products.filter((p) => p.is_new === 1).map((p) => p.id),
        trending: products.filter((p) => p.is_trending === 1).map((p) => p.id),
        best_seller: products.filter((p) => p.is_best_seller === 1).map((p) => p.id),
      };
      await api.put('/seller/storefront', payload);
      setMessage('Storefront updated successfully.');
    } catch (e: any) {
      setMessage(e?.response?.data?.message ?? 'Failed to update storefront');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-left">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Storefront Editor</h1>
      <p className="mt-2 text-gray-600">Choose which products appear as new, trending, and best seller.</p>

      {loading ? (
        <div className="mt-8 text-gray-600">Loading...</div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {products.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-lg p-4 bg-white flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-600">ID: {p.id}</div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={p.is_new === 1}
                      onChange={() => toggle(p.id, 'is_new')}
                    />
                    New
                  </label>
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={p.is_trending === 1}
                      onChange={() => toggle(p.id, 'is_trending')}
                    />
                    Trending
                  </label>
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={p.is_best_seller === 1}
                      onChange={() => toggle(p.id, 'is_best_seller')}
                    />
                    Best seller
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {message ? <div className="text-sm text-emerald-700">{message}</div> : null}
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-md bg-emerald-600 px-4 py-2 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save featured settings'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}


import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type StockRow = {
  id: number;
  name: string;
  image_url: string | null;
  stock_quantity: number;
};

export function InventoryReportPage() {
  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState<StockRow[]>([]);
  const [all, setAll] = useState<StockRow[]>([]);

  const refresh = async (th: number) => {
    setLoading(true);
    try {
      const r = await api.get('/seller/inventory-report', { params: { threshold: th } });
      setLowStock(r.data.lowStock ?? []);
      setAll(r.data.all ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh(threshold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await refresh(threshold);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-left">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Inventory Report</h1>
      <p className="mt-2 text-gray-600">See low-stock products based on a threshold.</p>

      <form onSubmit={onSubmit} className="mt-6 flex items-center gap-3">
        <label className="text-sm text-gray-700">Low stock threshold</label>
        <input
          type="number"
          min={0}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none"
        />
        <button className="rounded-md bg-emerald-600 px-4 py-2 text-white text-sm hover:bg-emerald-700">
          Refresh
        </button>
      </form>

      {loading ? (
        <div className="mt-8 text-gray-600">Loading...</div>
      ) : (
        <div className="mt-6 space-y-6">
          <section>
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Low stock (&le; {threshold})</h2>
              <div className="text-sm text-gray-600">{lowStock.length} items</div>
            </div>
            {lowStock.length === 0 ? (
              <div className="mt-3 text-gray-600">No products are below the threshold.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {lowStock.map((p) => (
                  <div key={p.id} className="border border-gray-200 rounded-lg bg-white p-4 flex items-center gap-4">
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
                    <div className="font-semibold text-amber-700">Stock: {p.stock_quantity}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All active products</h2>
              <div className="text-sm text-gray-600">{all.length} items</div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {all.map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-lg bg-white p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-sm text-gray-600">Stock: {p.stock_quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}


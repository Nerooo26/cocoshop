import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [dayTotal, setDayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.get('/seller/reports/day'), api.get('/seller/reports/month')])
      .then(([dayRes, monthRes]) => {
        setDayTotal(Number(dayRes.data.total ?? 0));
        setMonthTotal(Number(monthRes.data.total ?? 0));
      })
      .catch((e: any) => setError(e?.response?.data?.message ?? 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-left">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Reports</h1>
      <p className="mt-2 text-gray-600">Total sales for the day and this month.</p>

      {loading ? (
        <div className="mt-8 text-gray-600">Loading...</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-5 bg-white">
            <div className="text-sm text-gray-600">Today&apos;s total sales</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">₱{dayTotal.toFixed(2)}</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-5 bg-white">
            <div className="text-sm text-gray-600">This month&apos;s total sales</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">₱{monthTotal.toFixed(2)}</div>
          </div>
        </div>
      )}

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
    </div>
  );
}


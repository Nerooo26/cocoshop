import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Transaction = {
  orderId: number;
  paymentMethod: string;
  fulfillmentMethod: 'pickup' | 'delivery';
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
  items: Array<{
    productId: number;
    productName: string;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/transactions')
      .then((r) => setTransactions(r.data.transactions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-left">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Transaction History</h1>
      <p className="mt-2 text-gray-600">Your previous purchases.</p>

      {loading ? (
        <div className="mt-8 text-gray-600">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="mt-8 text-gray-600">No transactions yet.</div>
      ) : (
        <div className="mt-6 space-y-4">
          {transactions.map((t) => (
            <div key={t.orderId} className="border border-gray-200 rounded-lg bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">Order #{t.orderId}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{t.orderStatus}</div>
                  <div className="font-semibold mt-1">₱{Number(t.totalAmount).toFixed(2)}</div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-700">
                <div>Payment: {t.paymentMethod}</div>
                <div>Fulfillment: {t.fulfillmentMethod}</div>
              </div>

              <div className="mt-4 space-y-2">
                {t.items.map((it) => (
                  <div key={`${t.orderId}-${it.productId}`} className="flex items-center justify-between gap-3">
                    <div className="truncate">{it.productName}</div>
                    <div className="text-gray-600">
                      {it.quantity} x ₱{Number(it.unitPrice).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


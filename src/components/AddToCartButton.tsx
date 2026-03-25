import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function AddToCartButton({ productId }: { productId: number }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onAdd = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      await api.post('/cart/items', { productId, quantity: 1 });
      // Soft feedback without global toast system
      alert('Added to cart');
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onAdd}
      disabled={loading}
      className="w-full rounded-md bg-emerald-600 px-3 py-2 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
    >
      {loading ? 'Adding...' : 'Add to cart'}
    </button>
  );
}


import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export type SellerUser = {
  id: number;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  completeName: string;
  address: string;
  mobileNumber: string;
};

export function useCurrentUser() {
  const [user, setUser] = useState<SellerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}


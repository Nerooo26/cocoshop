import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { BuyerUser } from '../hooks/useCurrentUser';

export function RequireBuyerAuth({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAllowed(false);
      return;
    }

    api
      .get('/auth/me')
      .then((r) => {
        const u = r.data as BuyerUser;
        setAllowed(u.role === 'buyer' || u.role === 'admin');
      })
      .catch(() => setAllowed(false));
  }, []);

  if (allowed === null) return <div className="p-6 text-left">Loading...</div>;
  if (!allowed) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}


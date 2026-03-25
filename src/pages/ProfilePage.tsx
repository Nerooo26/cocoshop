import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function ProfilePage() {
  const { user, loading } = useCurrentUser();

  const [completeName, setCompleteName] = useState('');
  const [address, setAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setCompleteName(user.completeName ?? '');
    setAddress(user.address ?? '');
    setMobileNumber(user.mobileNumber ?? '');
  }, [user]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    await api.patch('/auth/me', { completeName, address, mobileNumber });
    const r = await api.get('/auth/me');
    setMessage('Profile updated successfully.');
    setCompleteName(r.data.completeName ?? '');
    setAddress(r.data.address ?? '');
    setMobileNumber(r.data.mobileNumber ?? '');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-left">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Profile</h1>
      <p className="mt-2 text-gray-600">Your account information.</p>

      {loading || !user ? (
        <div className="mt-8 text-gray-600">Loading...</div>
      ) : (
        <form onSubmit={onSave} className="mt-6 space-y-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="text-sm text-gray-600">Email</div>
            <div className="font-semibold">{user.email}</div>
          </div>

          <div>
            <label className="text-sm text-gray-700">Complete Name</label>
            <input
              value={completeName}
              onChange={(e) => setCompleteName(e.target.value)}
              className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Mobile Number</label>
            <input
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {message ? <div className="text-sm text-emerald-700">{message}</div> : null}

          <button className="w-full rounded-md bg-emerald-600 px-3 py-2 text-white text-sm hover:bg-emerald-700">
            Save Profile
          </button>
        </form>
      )}
    </div>
  );
}


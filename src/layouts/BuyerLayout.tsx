import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function BuyerLayout({ children }: { children?: ReactNode }) {
  const { user, loading } = useCurrentUser();
  const navigate = useNavigate();

  const onLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="CyberCoco logo" className="h-10 w-10" />
            <div className="text-left">
              <div className="text-lg font-semibold leading-5">CyberCoco</div>
              <div className="text-sm text-gray-600">Coconut Coir Products</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-600')}>
              Home
            </NavLink>
            <NavLink to="/storefront" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-600')}>
              Storefront
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-600')}>
              Products
            </NavLink>
            <NavLink to="/cart" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-600')}>
              Cart
            </NavLink>
            <NavLink to="/transactions" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-600')}>
              Transactions
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-600')}>
              Profile
            </NavLink>
          </nav>

          <div className="flex items-center gap-3 text-sm">
            {loading ? null : user ? (
              <>
                <button
                  onClick={onLogout}
                  className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="text-gray-600 hover:font-semibold" to="/login">
                  Login
                </Link>
                <Link
                  className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
                  to="/register"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children ?? <Outlet />}
      </main>

      <footer className="border-t border-gray-200 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600">
          For educational purposes only, and no copyright infringement is intended.
        </div>
      </footer>
    </div>
  );
}


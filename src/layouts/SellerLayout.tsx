import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function SellerLayout({ children }: { children?: ReactNode }) {
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
          <Link to="/storefront-editor" className="flex items-center gap-3">
            <img src="/logo.svg" alt="CyberCoco logo" className="h-10 w-10" />
            <div className="text-left">
              <div className="text-lg font-semibold leading-5">CyberCoco</div>
              <div className="text-sm text-gray-600">Seller Portal</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm">
            <NavLink
              to="/storefront-editor"
              className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-600')}
            >
              Storefront
            </NavLink>
            <NavLink to="/inventory" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-600')}>
              Inventory
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-600')}>
              Reports
            </NavLink>
            <NavLink
              to="/inventory-report"
              className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-600')}
            >
              Inventory Report
            </NavLink>
          </nav>

          <div className="flex items-center gap-3 text-sm">
            {loading ? null : user ? (
              <button onClick={onLogout} className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50">
                Logout
              </button>
            ) : (
              <Link className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50" to="/login">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children ?? <Outlet />}</main>

      <footer className="border-t border-gray-200 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600">
          For educational purposes only, and no copyright infringement is intended.
        </div>
      </footer>
    </div>
  );
}


import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-left">
      <h1 className="text-2xl font-semibold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600">The page you requested does not exist.</p>
      <Link to="/storefront-editor" className="mt-4 inline-block text-emerald-700 hover:underline text-sm">
        Back to Storefront Editor
      </Link>
    </div>
  );
}


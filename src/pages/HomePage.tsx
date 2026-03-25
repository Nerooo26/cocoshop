import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { AddToCartButton } from '../components/AddToCartButton';

type Featured = {
  new: any[];
  trending: any[];
  best_seller: any[];
};

export function HomePage() {
  const [featured, setFeatured] = useState<Featured>({ new: [], trending: [], best_seller: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/products/storefront')
      .then((r) => setFeatured(r.data.featured))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const token = localStorage.getItem('token');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-left">
      <section className="flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">Eco-friendly coconut coir products</h1>
          <p className="mt-3 text-gray-600">
            From construction materials to gardening essentials. Shop the freshest coconut coir items from CyberCoco.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/storefront"
              className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-700"
            >
              Shop featured
            </Link>
            <Link
              to="/products"
              className="rounded-md border border-gray-300 text-gray-700 px-4 py-2 text-sm hover:bg-gray-50"
            >
              View all products
            </Link>
          </div>
        </div>
        <div className="w-full md:w-80 rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-600">Featured highlights</div>
          <div className="mt-3 space-y-2">
            <div>
              <div className="font-semibold">New</div>
              <div className="text-gray-600">{featured.new.length} items</div>
            </div>
            <div>
              <div className="font-semibold">Trending</div>
              <div className="text-gray-600">{featured.trending.length} items</div>
            </div>
            <div>
              <div className="font-semibold">Best seller</div>
              <div className="text-gray-600">{featured.best_seller.length} items</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">Featured products</h2>
        {loading ? (
          <div className="mt-4 text-gray-600">Loading...</div>
        ) : (
          <div className="mt-6 space-y-8">
            {[
              { tag: 'new', title: 'New arrivals', items: featured.new },
              { tag: 'trending', title: 'Trending now', items: featured.trending },
              { tag: 'best_seller', title: 'Best sellers', items: featured.best_seller },
            ].map((section) => (
              <div key={section.tag}>
                <div className="flex items-end justify-between">
                  <div className="text-lg font-semibold">{section.title}</div>
                  <Link to="/storefront" className="text-sm text-emerald-700 hover:underline">
                    See all
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.slice(0, 3).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      action={
                        token ? <AddToCartButton productId={p.id} /> : <div className="text-sm text-gray-600">Login to buy</div>
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


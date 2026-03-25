import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { AddToCartButton } from '../components/AddToCartButton';

type Featured = {
  new: any[];
  trending: any[];
  best_seller: any[];
};

export function StorefrontPage() {
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
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Storefront</h1>
      <p className="mt-2 text-gray-600">Browse featured coconut coir products.</p>

      {loading ? (
        <div className="mt-8 text-gray-600">Loading...</div>
      ) : (
        <div className="mt-8 space-y-10">
          {[
            { tag: 'new', title: 'New' as const, items: featured.new },
            { tag: 'trending', title: 'Trending' as const, items: featured.trending },
            { tag: 'best_seller', title: 'Best sellers' as const, items: featured.best_seller },
          ].map((section) => (
            <section key={section.tag}>
              <div className="flex items-end justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                <div className="text-sm text-gray-600">{section.items.length} items</div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    action={
                      token ? <AddToCartButton productId={p.id} /> : <div className="text-sm text-gray-600">Login to buy</div>
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}


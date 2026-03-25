import type { ReactNode } from 'react';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  imageUrl?: string;
};

export function ProductCard({ product, action }: { product: Product; action?: ReactNode }) {
  const image = product.imageUrl ?? product.image_url;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="h-48 bg-gray-50">
        {image ? (
          <img src={image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>
      <div className="p-4 text-left">
        <div className="font-semibold">{product.name}</div>
        <div className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</div>
        <div className="mt-3 font-semibold text-gray-900">₱{Number(product.price).toFixed(2)}</div>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}


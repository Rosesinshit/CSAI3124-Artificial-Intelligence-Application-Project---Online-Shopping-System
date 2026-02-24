import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const FALLBACK = 'https://via.placeholder.com/300x300?text=No+Image';
  const imageUrl = product.primary_image || FALLBACK;

  // Promotional pricing takes precedence over sale_price
  const promoPrice = product.promotional_price ? parseFloat(product.promotional_price) : null;
  const salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
  const originalPrice = parseFloat(product.price);
  const displayPrice = promoPrice || salePrice || originalPrice;
  const hasDiscount = displayPrice < originalPrice;
  const hasPromo = !!promoPrice;

  return (
    <Link
      to={`/product/${product.product_id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
        />
        {hasPromo ? (
          <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
            {product.promotion_name || 'DEAL'}
          </span>
        ) : hasDiscount ? (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            SALE
          </span>
        ) : null}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1">{product.name}</h3>
        {product.category_name && (
          <p className="text-xs text-gray-500 mb-2">{product.category_name}</p>
        )}
        <div className="mt-auto flex items-center gap-2">
          <span className={`text-lg font-bold ${hasPromo ? 'text-purple-600' : 'text-blue-600'}`}>
            ${displayPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
          )}
        </div>
        {product.short_description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.short_description}</p>
        )}
      </div>
    </Link>
  );
}

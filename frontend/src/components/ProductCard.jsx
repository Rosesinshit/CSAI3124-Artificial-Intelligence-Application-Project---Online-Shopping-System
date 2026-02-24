import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const FALLBACK = 'https://via.placeholder.com/300x300?text=No+Image';
  const imageUrl = product.primary_image || FALLBACK;

  const promoPrice = product.promotional_price ? parseFloat(product.promotional_price) : null;
  const salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
  const originalPrice = parseFloat(product.price);
  const displayPrice = promoPrice || salePrice || originalPrice;
  const hasDiscount = displayPrice < originalPrice;
  const hasPromo = !!promoPrice;

  return (
    <Link
      to={`/product/${product.product_id}`}
      className="glass-card group !rounded-2xl overflow-hidden flex flex-col hover:scale-[1.02] transition-transform duration-300"
    >
      <div className="aspect-square bg-apple-gray-5 relative overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK; }}
        />
        {hasPromo ? (
          <span className="absolute top-2.5 right-2.5 bg-apple-orange text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
            {product.promotion_name || 'DEAL'}
          </span>
        ) : hasDiscount ? (
          <span className="absolute top-2.5 right-2.5 bg-apple-red text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
            SALE
          </span>
        ) : null}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-apple-dark line-clamp-2 mb-0.5 tracking-tight">{product.name}</h3>
        {product.category_name && (
          <p className="text-[10px] text-apple-gray mb-2 uppercase tracking-wider">{product.category_name}</p>
        )}
        <div className="mt-auto flex items-center gap-2">
          <span className={`text-base font-semibold ${hasPromo ? 'text-apple-orange' : 'text-apple-dark'}`}>
            ${displayPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-apple-gray line-through">${originalPrice.toFixed(2)}</span>
          )}
        </div>
        {product.short_description && (
          <p className="text-xs text-apple-gray mt-1 line-clamp-2">{product.short_description}</p>
        )}
      </div>
    </Link>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();
  const navigate = useNavigate();

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="shimmer w-6 h-6 rounded-full" />
    </div>
  );

  return (
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <h1 className="section-heading">Bag</h1>

      {cart.items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-apple-gray text-sm mb-5">Your bag is empty.</p>
          <Link to="/products" className="btn-apple btn-apple-primary text-sm">Continue Shopping</Link>
        </div>
      ) : (
        <>
          <div className="glass rounded-2xl overflow-hidden divide-y divide-black/[0.04]">
            {cart.items.map((item) => (
              <div key={item.cart_item_id} className="flex items-center p-5 gap-5">
                <img
                  src={item.image_url || 'https://via.placeholder.com/80x80?text=No+Img'}
                  alt={item.name}
                  className="w-[72px] h-[72px] rounded-xl object-cover bg-apple-gray-5 flex-shrink-0"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=No+Img'; }}
                />
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product_id}`} className="text-sm font-medium text-apple-dark hover:text-apple-blue transition-colors line-clamp-1">
                    {item.name}
                  </Link>
                  <p className="text-sm text-apple-blue font-medium mt-0.5">
                    ${parseFloat(item.sale_price || item.price).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center glass-light rounded-full">
                  <button
                    onClick={() => updateQuantity(item.cart_item_id, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-apple-gray hover:text-apple-dark transition-colors text-sm"
                  >−</button>
                  <span className="w-8 text-center text-sm font-medium text-apple-dark">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-apple-gray hover:text-apple-dark transition-colors text-sm"
                  >+</button>
                </div>
                <span className="w-20 text-right text-sm font-semibold text-apple-dark">
                  ${parseFloat(item.line_total).toFixed(2)}
                </span>
                <button
                  onClick={() => removeItem(item.cart_item_id)}
                  className="text-apple-gray hover:text-apple-red transition-colors ml-1"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm text-apple-gray">Subtotal ({cart.item_count} items)</span>
              <span className="text-xl font-semibold text-apple-dark tracking-tight">${cart.total_amount}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={clearCart}
                className="btn-apple btn-apple-secondary text-xs"
              >
                Clear Bag
              </button>
              <Link to="/products" className="btn-apple btn-apple-secondary text-xs text-center">
                Continue Shopping
              </Link>
              <button
                onClick={() => navigate('/checkout')}
                className="flex-1 btn-apple btn-apple-primary text-sm"
              >
                Check Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

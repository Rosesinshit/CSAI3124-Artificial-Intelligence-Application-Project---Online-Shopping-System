import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();
  const navigate = useNavigate();

  if (loading) return <div className="text-center py-16 text-gray-500">Loading cart...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Shopping Cart</h1>

      {cart.items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
          <Link to="/products" className="text-blue-600 font-medium hover:underline">Continue Shopping</Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {cart.items.map((item) => (
              <div key={item.cart_item_id} className="flex items-center p-4 border-b last:border-b-0 hover:bg-gray-50">
                {/* Image */}
                <img
                  src={item.image_url || 'https://via.placeholder.com/80x80?text=No+Img'}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=No+Img'; }}
                />

                {/* Info */}
                <div className="flex-1 ml-4">
                  <Link to={`/product/${item.product_id}`} className="font-medium text-gray-800 hover:text-blue-600">
                    {item.name}
                  </Link>
                  <p className="text-blue-600 font-semibold">
                    ${parseFloat(item.sale_price || item.price).toFixed(2)}
                  </p>
                </div>

                {/* Quantity */}
                <div className="flex items-center border border-gray-300 rounded-lg mx-4">
                  <button
                    onClick={() => updateQuantity(item.cart_item_id, Math.max(1, item.quantity - 1))}
                    className="px-2 py-1 hover:bg-gray-100 text-sm"
                  >
                    −
                  </button>
                  <span className="px-3 py-1 font-medium text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                    className="px-2 py-1 hover:bg-gray-100 text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Line Total */}
                <span className="w-24 text-right font-semibold text-gray-800">
                  ${parseFloat(item.line_total).toFixed(2)}
                </span>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.cart_item_id)}
                  className="ml-4 text-red-500 hover:text-red-700"
                  title="Remove"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Items ({cart.item_count})</span>
              <span className="text-xl font-bold text-gray-800">${cart.total_amount}</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={clearCart}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
              >
                Clear Cart
              </button>
              <Link to="/products" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm text-center">
                Continue Shopping
              </Link>
              <button
                onClick={() => navigate('/checkout')}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

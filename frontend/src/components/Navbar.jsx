import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { wishlist, notifications } = useWishlist();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">🛒 ShopOnline</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">
                🔍
              </button>
            </div>
          </form>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/products" className="text-gray-600 hover:text-blue-600 font-medium">Products</Link>
            <Link to="/promotions" className="text-red-500 hover:text-red-700 font-medium">Deals</Link>

            {user ? (
              <>
                <Link to="/wishlist" className="relative text-gray-600 hover:text-red-500" title="Wish List">
                  ♥
                  {(wishlist.item_count > 0 || notifications.total_notifications > 0) && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.total_notifications > 0 ? notifications.total_notifications : wishlist.item_count}
                    </span>
                  )}
                </Link>
                <Link to="/cart" className="relative text-gray-600 hover:text-blue-600">
                  🛒
                  {cart.item_count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cart.item_count}
                    </span>
                  )}
                </Link>
                <Link to="/orders" className="text-gray-600 hover:text-blue-600 font-medium">Orders</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-purple-600 hover:text-purple-800 font-medium">Admin</Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
                  >
                    <span className="font-medium">{user.full_name?.split(' ')[0]}</span>
                    <span>▼</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border">
                      <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Profile</Link>
                      <Link to="/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">My Orders</Link>
                      <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Wish List</Link>
                      <button onClick={() => { logout(); setMenuOpen(false); navigate('/'); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">Register</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-600">
            ☰
          </button>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </form>
      </div>
    </nav>
  );
}

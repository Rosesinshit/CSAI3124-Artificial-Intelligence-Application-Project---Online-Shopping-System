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
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-[980px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-11">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <svg className="w-5 h-5 text-apple-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs">
            <Link to="/products" className="text-apple-dark/80 hover:text-apple-dark transition-colors">Products</Link>
            <Link to="/promotions" className="text-apple-dark/80 hover:text-apple-dark transition-colors">Deals</Link>
            {user && <Link to="/orders" className="text-apple-dark/80 hover:text-apple-dark transition-colors">Orders</Link>}
            {user?.role === 'admin' && <Link to="/admin" className="text-apple-dark/80 hover:text-apple-dark transition-colors">Admin</Link>}
          </div>

          {/* Right Icons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search Toggle */}
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-apple-dark/70 hover:text-apple-dark transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            {user ? (
              <>
                <Link to="/wishlist" className="relative text-apple-dark/70 hover:text-apple-dark transition-colors" title="Wish List">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  {(wishlist.item_count > 0 || notifications.total_notifications > 0) && (
                    <span className="absolute -top-1.5 -right-1.5 bg-apple-red text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-medium">
                      {notifications.total_notifications > 0 ? notifications.total_notifications : wishlist.item_count}
                    </span>
                  )}
                </Link>
                <Link to="/cart" className="relative text-apple-dark/70 hover:text-apple-dark transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  {cart.item_count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-apple-blue text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-medium">
                      {cart.item_count}
                    </span>
                  )}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-1 text-xs text-apple-dark/70 hover:text-apple-dark transition-colors"
                  >
                    <span className="font-medium">{user.full_name?.split(' ')[0]}</span>
                    <svg className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-44 glass-heavy rounded-2xl py-1.5 animate-scale-in overflow-hidden">
                      <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-xs text-apple-dark hover:bg-apple-gray-4/50 transition-colors">Profile</Link>
                      <Link to="/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-xs text-apple-dark hover:bg-apple-gray-4/50 transition-colors">My Orders</Link>
                      <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-xs text-apple-dark hover:bg-apple-gray-4/50 transition-colors">Wish List</Link>
                      <div className="border-t border-apple-gray-4/50 my-1" />
                      <button onClick={() => { logout(); setMenuOpen(false); navigate('/'); }} className="w-full text-left px-4 py-2 text-xs text-apple-red hover:bg-apple-gray-4/50 transition-colors">Sign Out</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-xs text-apple-dark/70 hover:text-apple-dark transition-colors">Sign In</Link>
                <Link to="/register" className="btn-apple btn-apple-primary !text-xs !px-3 !py-1">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-apple-dark/70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="pb-2.5 animate-fade-in">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="glass-input w-full !py-1.5 !text-xs"
              autoFocus
            />
          </form>
        )}

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden pb-2.5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="glass-input w-full !py-1.5 !text-xs"
          />
        </form>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 animate-fade-in space-y-1">
            <Link to="/products" onClick={() => setMenuOpen(false)} className="block py-2 text-xs text-apple-dark/80">Products</Link>
            <Link to="/promotions" onClick={() => setMenuOpen(false)} className="block py-2 text-xs text-apple-dark/80">Deals</Link>
            {user ? (
              <>
                <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="block py-2 text-xs text-apple-dark/80">Wish List</Link>
                <Link to="/cart" onClick={() => setMenuOpen(false)} className="block py-2 text-xs text-apple-dark/80">Bag</Link>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className="block py-2 text-xs text-apple-dark/80">Orders</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-2 text-xs text-apple-dark/80">Profile</Link>
                {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block py-2 text-xs text-apple-dark/80">Admin</Link>}
                <button onClick={() => { logout(); setMenuOpen(false); navigate('/'); }} className="block py-2 text-xs text-apple-red">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-xs text-apple-dark/80">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-2 text-xs text-apple-blue font-medium">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-apple-gray-5 border-t border-black/5 mt-16">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Links Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 text-xs">
          <div>
            <h4 className="font-semibold text-apple-dark mb-3">Shop</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-apple-gray hover:text-apple-dark transition-colors">All Products</Link></li>
              <li><Link to="/promotions" className="text-apple-gray hover:text-apple-dark transition-colors">Deals</Link></li>
              <li><Link to="/search" className="text-apple-gray hover:text-apple-dark transition-colors">Search</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-apple-dark mb-3">Account</h4>
            <ul className="space-y-2">
              <li><Link to="/orders" className="text-apple-gray hover:text-apple-dark transition-colors">My Orders</Link></li>
              <li><Link to="/wishlist" className="text-apple-gray hover:text-apple-dark transition-colors">Wish List</Link></li>
              <li><Link to="/profile" className="text-apple-gray hover:text-apple-dark transition-colors">Profile</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-apple-dark mb-3">Support</h4>
            <ul className="space-y-2">
              <li><span className="text-apple-gray">support@shoponline.com</span></li>
              <li><span className="text-apple-gray">+852 1234 5678</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-apple-dark mb-3">About</h4>
            <p className="text-apple-gray leading-relaxed">
              Your trusted online shopping destination. Quality products at great prices.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-black/5 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-apple-gray">
            © 2026 ShopOnline. All Rights Reserved. CSAI3124 Project.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-apple-gray">
            <span>Privacy Policy</span>
            <span>Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

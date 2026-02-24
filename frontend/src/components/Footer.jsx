export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">🛒 ShopOnline</h3>
            <p className="text-sm">Your trusted online shopping destination. Quality products at great prices.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="/products" className="hover:text-white">All Products</a></li>
              <li><a href="/search" className="hover:text-white">Search</a></li>
              <li><a href="/orders" className="hover:text-white">My Orders</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-1 text-sm">
              <li>Email: support@shoponline.com</li>
              <li>Phone: +852 1234 5678</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-6 pt-4 text-center text-sm">
          © 2026 ShopOnline. All Rights Reserved. CSAI3124 Project.
        </div>
      </div>
    </footer>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const selectedTags = searchParams.get('tags') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data.data)).catch(() => {});
    api.get('/tags').then(res => setTags(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 12, sort });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (selectedTags) params.set('tags', selectedTags);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);

    api.get(`/products/search?${params}`)
      .then((res) => {
        setProducts(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q, category, selectedTags, minPrice, maxPrice, sort, page]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  const toggleTag = (tagSlug) => {
    const current = selectedTags ? selectedTags.split(',') : [];
    const updated = current.includes(tagSlug)
      ? current.filter(t => t !== tagSlug)
      : [...current, tagSlug];
    updateParam('tags', updated.join(','));
  };

  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (localMinPrice) params.set('min_price', localMinPrice);
    else params.delete('min_price');
    if (localMaxPrice) params.set('max_price', localMaxPrice);
    else params.delete('max_price');
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        {q ? `Search Results for "${q}"` : 'Advanced Search'}
      </h1>
      {meta && <p className="text-sm text-gray-500 mb-6">{meta.total} product(s) found</p>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar (C3) */}
        <aside className="space-y-6">
          {/* Search Box */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2">Search</h3>
            <form onSubmit={(e) => { e.preventDefault(); updateParam('q', e.target.q.value); }}>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search keywords..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </form>
          </div>

          {/* Category Filter */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2">Category</h3>
            <select
              value={category}
              onChange={(e) => updateParam('category', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2">Price Range</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <button
              onClick={applyPriceFilter}
              className="w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700"
            >
              Apply
            </button>
          </div>

          {/* Tag Filter */}
          {tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTags.split(',').includes(tag.slug);
                  return (
                    <button
                      key={tag.tag_id}
                      onClick={() => toggleTag(tag.slug)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      #{tag.name} ({tag.product_count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-2">Sort By</h3>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-16 text-gray-500">Searching...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No products match your search criteria.</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
              </div>
              <Pagination meta={meta} onPageChange={(p) => updateParam('page', p)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import SEOHead from '../components/SEOHead';

export default function ProductListPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategoryName, setActiveCategoryName] = useState('');
  const [categorySeo, setCategorySeo] = useState(null);

  const page = parseInt(searchParams.get('page')) || 1;
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 12, sort });

    // If we have a slug from /category/:slug route, resolve it to category ID
    const catPromise = api.get('/categories');

    catPromise.then((catRes) => {
      const allCats = catRes.data.data;
      setCategories(allCats);

      let categoryId = category;
      setCategorySeo(null);
      if (slug) {
        const matched = allCats.find(c => c.slug === slug);
        if (matched) {
          categoryId = matched.category_id;
          setActiveCategoryName(matched.name);
          // Fetch category SEO data from backend
          api.get(`/seo/category/${slug}`).then(seoRes => {
            setCategorySeo(seoRes.data.data);
          }).catch(() => {});
        }
      } else if (categoryId) {
        const matched = allCats.find(c => String(c.category_id) === String(categoryId));
        setActiveCategoryName(matched ? matched.name : '');
      } else {
        setActiveCategoryName('');
      }

      if (categoryId) params.set('category', categoryId);
      return api.get(`/products?${params}`);
    }).then((prodRes) => {
      setProducts(prodRes.data.data);
      setMeta(prodRes.data.meta);
    }).catch(console.error).finally(() => setLoading(false));
  }, [page, category, sort, slug]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <div className="max-w-[980px] mx-auto px-4 py-10">
      <SEOHead
        title={categorySeo?.metaTags?.title || (activeCategoryName ? `${activeCategoryName} - ShopOnline` : 'All Products - ShopOnline')}
        description={categorySeo?.metaTags?.description || (activeCategoryName ? `Browse ${activeCategoryName} products at great prices.` : 'Browse our full product catalog.')}
        keywords={activeCategoryName ? `${activeCategoryName.toLowerCase()}, shopping, buy online` : 'products, shopping, buy online'}
        canonical={categorySeo?.metaTags?.canonical || (slug ? `${window.location.origin}/category/${slug}` : `${window.location.origin}/products`)}
        ogTitle={categorySeo?.metaTags?.ogTitle}
        ogDescription={categorySeo?.metaTags?.ogDescription}
        ogUrl={categorySeo?.metaTags?.ogUrl}
        ogType={categorySeo?.metaTags?.ogType}
        ogSiteName={categorySeo?.metaTags?.ogSiteName}
        jsonLd={categorySeo?.breadcrumbLd}
      />
      <h1 className="section-heading mb-5">{activeCategoryName || 'All Products'}</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={category}
          onChange={(e) => updateParam('category', e.target.value)}
          className="glass-input !w-auto !py-1.5 !text-xs"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="glass-input !w-auto !py-1.5 !text-xs"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name">Name: A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="shimmer w-6 h-6 rounded-full" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-apple-gray text-sm">No products found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
          </div>
          <Pagination meta={meta} onPageChange={(p) => updateParam('page', p)} />
        </>
      )}
    </div>
  );
}

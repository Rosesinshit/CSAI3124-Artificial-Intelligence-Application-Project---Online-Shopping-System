export default function Pagination({ meta, onPageChange, onLoadMore, loadingMore, mobilePage }) {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages } = meta;
  const mPage = mobilePage || page;

  // Desktop pagination range
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const btnBase = 'w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200';
  const btnActive = 'bg-apple-blue text-white shadow-md';
  const btnDefault = 'text-apple-dark/70 hover:bg-black/5 hover:text-apple-dark';
  const btnDisabled = 'text-apple-gray-3 cursor-not-allowed opacity-50';

  return (
    <>
      {/* Desktop pagination — uses meta.page (from URL/API) */}
      <div className={`${onLoadMore ? 'hidden lg:flex' : 'flex'} items-center justify-center mt-10`}>
        <div className="glass-nav flex items-center justify-center gap-1 px-2 py-2 rounded-full shadow-sm border border-black/5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={`${btnBase} ${page <= 1 ? btnDisabled : btnDefault}`}
          >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        {startPage > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className={`${btnBase} ${btnDefault}`}>1</button>
            {startPage > 2 && <span className="text-apple-gray px-1">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${p === page ? btnActive : btnDefault}`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-apple-gray px-1">...</span>}
            <button onClick={() => onPageChange(totalPages)} className={`${btnBase} ${btnDefault}`}>{totalPages}</button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`${btnBase} ${page >= totalPages ? btnDisabled : btnDefault}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        </div>
      </div>

      {/* Mobile load more button — uses mobilePage for progress tracking */}
      {onLoadMore && mPage < totalPages && (
        <div className="lg:hidden flex justify-center mt-8">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="btn-apple btn-apple-primary text-sm px-8 py-2.5"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <span className="shimmer w-4 h-4 rounded-full inline-block" />
                Loading...
              </span>
            ) : (
              `Load More (${mPage} of ${totalPages})`
            )}
          </button>
        </div>
      )}
    </>
  );
}

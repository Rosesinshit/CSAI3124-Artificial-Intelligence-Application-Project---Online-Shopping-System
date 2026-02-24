export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;

  const pages = [];
  const { page, totalPages } = meta;
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const btnBase = 'w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200';
  const btnActive = 'bg-apple-dark text-white';
  const btnDefault = 'text-apple-dark/70 hover:bg-black/[0.04]';
  const btnDisabled = 'text-apple-gray-3 cursor-not-allowed';

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
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
  );
}

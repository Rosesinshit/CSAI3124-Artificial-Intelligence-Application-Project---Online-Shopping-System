const STATUS_CONFIG = {
  PENDING: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-apple-blue/10', text: 'text-apple-blue', dot: 'bg-apple-blue' },
  SHIPPED: { label: 'Shipped', bg: 'bg-purple-500/10', text: 'text-purple-600', dot: 'bg-purple-500' },
  COMPLETED: { label: 'Completed', bg: 'bg-apple-green/10', text: 'text-apple-green', dot: 'bg-apple-green' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-apple-red/10', text: 'text-apple-red', dot: 'bg-apple-red' },
  HOLD: { label: 'On Hold', bg: 'bg-apple-orange/10', text: 'text-apple-orange', dot: 'bg-apple-orange' },
};

export default function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-100', text: 'text-apple-gray', dot: 'bg-apple-gray' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

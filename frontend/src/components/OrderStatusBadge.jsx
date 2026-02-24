const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: '✅' },
  SHIPPED: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: '🚚' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: '✔️' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '❌' },
  HOLD: { label: 'On Hold', color: 'bg-orange-100 text-orange-800', icon: '⏸️' },
};

export default function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: '?' };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

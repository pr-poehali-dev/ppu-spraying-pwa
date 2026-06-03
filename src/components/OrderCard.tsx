import { Order, MATERIAL_LABELS, formatCurrency } from '@/data/mockData';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const isCompleted = order.status === 'completed';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-3 cursor-pointer hover-scale transition-all duration-200 ${
        isCompleted ? 'status-completed' : 'status-planned'
      }`}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <span className="font-semibold text-sm leading-tight truncate flex-1">
          {order.customer_name}
        </span>
        {isCompleted && (
          <span className="text-xs neon-text font-medium shrink-0">✓</span>
        )}
      </div>
      <a
        href={`tel:${order.customer_phone}`}
        onClick={(e) => e.stopPropagation()}
        className="text-xs text-muted-foreground hover:neon-text transition-colors block mb-1"
      >
        {order.customer_phone}
      </a>
      <div className="text-xs text-muted-foreground truncate mb-1.5">{order.address}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs bg-white/5 rounded-md px-1.5 py-0.5">
            {order.planned_volume_m2} м²
          </span>
          <span className={`text-xs rounded-md px-1.5 py-0.5 ${
            order.material === 'polimochevina'
              ? 'bg-purple-500/15 text-purple-300'
              : 'bg-blue-500/15 text-blue-300'
          }`}>
            {MATERIAL_LABELS[order.material]}
          </span>
        </div>
        <span className={`text-xs font-semibold ${isCompleted ? 'neon-text' : ''}`}>
          {formatCurrency(order.total_amount)}
        </span>
      </div>
    </div>
  );
}

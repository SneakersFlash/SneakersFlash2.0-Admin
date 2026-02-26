import { cn } from '@/lib/utils';
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  PRODUCT_STATUS_CONFIG,
  VOUCHER_STATUS_CONFIG,
  CAMPAIGN_STATUS_CONFIG,
} from '@/lib/constants';
import type { OrderStatus, PaymentStatus } from '@/types/order.types';
import type { ProductStatus } from '@/types/product.types';
import type { VoucherStatus, CampaignStatus } from '@/types/index';

type StatusBadgeProps =
  | { type: 'order';    status: OrderStatus    }
  | { type: 'payment';  status: PaymentStatus  }
  | { type: 'product';  status: ProductStatus  }
  | { type: 'voucher';  status: VoucherStatus  }
  | { type: 'campaign'; status: CampaignStatus };

export default function StatusBadge(props: StatusBadgeProps) {
  let config: { label: string; color: string; bgColor: string };

  switch (props.type) {
    case 'order':    config = ORDER_STATUS_CONFIG[props.status];    break;
    case 'payment':  config = PAYMENT_STATUS_CONFIG[props.status];  break;
    case 'product':  config = PRODUCT_STATUS_CONFIG[props.status];  break;
    case 'voucher':  config = VOUCHER_STATUS_CONFIG[props.status];  break;
    case 'campaign': config = CAMPAIGN_STATUS_CONFIG[props.status]; break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bgColor,
        config.color,
      )}
    >
      {config.label}
    </span>
  );
}

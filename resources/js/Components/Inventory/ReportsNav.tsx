import { Link } from '@inertiajs/react';
import { Nav } from 'react-bootstrap';

import {
    categoryProfit,
    daily,
    delivery,
    deliveryFailed,
    monthly,
    profit,
    stockLoss,
    stockValue,
} from '@/routes/reports';

type ReportsNavProps = {
    active:
        | 'daily'
        | 'delivery'
        | 'monthly'
        | 'profit'
        | 'category-profit'
        | 'stock-value'
        | 'stock-loss'
        | 'delivery-failed';
};

const items = [
    { key: 'daily', label: 'Daily Sales', href: daily.url() },
    { key: 'delivery', label: 'Delivery Report', href: delivery.url() },
    { key: 'monthly', label: 'Monthly Sales', href: monthly.url() },
    { key: 'profit', label: 'Profit & Loss', href: profit.url() },
    {
        key: 'category-profit',
        label: 'Category Profit',
        href: categoryProfit.url(),
    },
    { key: 'stock-value', label: 'Stock Value', href: stockValue.url() },
    { key: 'stock-loss', label: 'Stock Loss', href: stockLoss.url() },
    {
        key: 'delivery-failed',
        label: 'Failed Delivery',
        href: deliveryFailed.url(),
    },
] as const;

export default function ReportsNav({ active }: ReportsNavProps) {
    return (
        <Nav className="mb-4 flex-wrap gap-2" variant="pills">
            {items.map((item) => (
                <Nav.Item key={item.key}>
                    <Link
                        href={item.href}
                        className={`btn btn-sm ${active === item.key ? 'btn-primary' : 'btn-light border'}`}
                    >
                        {item.label}
                    </Link>
                </Nav.Item>
            ))}
        </Nav>
    );
}

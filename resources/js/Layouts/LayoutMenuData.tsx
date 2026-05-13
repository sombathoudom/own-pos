const navdata = () => {
    return {
        props: {
            children: [
                {
                    label: 'Menu',
                    isHeader: true,
                },
                {
                    id: 'dashboard',
                    label: 'Dashboard',
                    icon: 'ri-dashboard-2-line',
                    link: '/dashboard',
                },
                {
                    label: 'Inventory',
                    isHeader: true,
                },
                {
                    id: 'categories',
                    label: 'Categories',
                    icon: 'ri-folder-3-line',
                    link: '/categories',
                },
                {
                    id: 'suppliers',
                    label: 'Suppliers',
                    icon: 'ri-truck-line',
                    link: '/suppliers',
                },
                {
                    id: 'products',
                    label: 'Products',
                    icon: 'ri-price-tag-3-line',
                    link: '/products',
                },
                {
                    id: 'purchases',
                    label: 'Purchases',
                    icon: 'ri-shopping-bag-line',
                    link: '/purchases',
                },
                {
                    id: 'sales',
                    label: 'Sales',
                    icon: 'ri-shopping-cart-2-line',
                    link: '/sales',
                },
                {
                    id: 'pos',
                    label: 'POS',
                    icon: 'ri-cash-register-line',
                    link: '/pos',
                },
                {
                    id: 'stock',
                    label: 'Stock',
                    icon: 'ri-inbox-archive-line',
                    link: '/stock',
                },
                {
                    id: 'expenses',
                    label: 'Expenses',
                    icon: 'ri-money-dollar-circle-line',
                    link: '/expenses',
                },
                {
                    id: 'stock-adjustments',
                    label: 'Stock Adjustments',
                    icon: 'ri-tools-line',
                    link: '/stock-adjustments',
                },
                {
                    id: 'stock-counts',
                    label: 'Stock Counts',
                    icon: 'ri-checkbox-multiple-line',
                    link: '/stock-counts',
                },
                {
                    id: 'daily-closings',
                    label: 'Daily Closings',
                    icon: 'ri-calendar-check-line',
                    link: '/daily-closings',
                },
                {
                    id: 'reports',
                    label: 'Reports',
                    icon: 'ri-bar-chart-box-line',
                    link: '/reports/daily',
                },
                {
                    id: 'low-stock',
                    label: 'Low Stock',
                    icon: 'ri-alarm-warning-line',
                    link: '/low-stock',
                },
                {
                    id: 'audit-logs',
                    label: 'Audit Logs',
                    icon: 'ri-shield-check-line',
                    link: '/audit-logs',
                },
                {
                    label: 'Settings',
                    isHeader: true,
                },
                {
                    id: 'profile-settings',
                    label: 'Profile',
                    icon: 'ri-user-3-line',
                    link: '/settings/profile',
                },
                {
                    id: 'security-settings',
                    label: 'Security',
                    icon: 'ri-shield-keyhole-line',
                    link: '/settings/security',
                },
                {
                    id: 'appearance-settings',
                    label: 'Appearance',
                    icon: 'ri-palette-line',
                    link: '/settings/appearance',
                },
            ],
        },
    };
};

export default navdata;

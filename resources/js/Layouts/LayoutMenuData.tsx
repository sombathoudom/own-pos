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
                    id: 'stock',
                    label: 'Stock',
                    icon: 'ri-inbox-archive-line',
                    link: '/stock',
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

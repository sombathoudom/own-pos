export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type LaravelPaginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
    prev_page_url?: string | null;
    next_page_url?: string | null;
};

export type ToastMessage = {
    type: string;
    message: string;
} | null;

export type DashboardSummary = {
    today_sales_usd: string;
    today_orders: number;
    month_sales_usd: string;
    total_sales_usd: string;
    outstanding_usd: string;
    low_stock_items: number;
    today_expenses_usd: string;
    today_closing_status: string;
};

export type DashboardPaymentBreakdown = {
    status: string;
    total: number;
};

export type DashboardSalesTrendPoint = {
    date: string;
    label: string;
    sales_usd: string;
    expenses_usd: string;
    orders: number;
};

export type DashboardTopProduct = {
    variant_id: number;
    product_name: string | null;
    sku: string | null;
    color: string | null;
    size: string | null;
    stock_on_hand: number;
    qty_sold: number;
    revenue_usd: string;
};

export type DashboardRecentSale = {
    id: number;
    invoice_no: string;
    customer_name: string | null;
    payment_received_date: string | null;
    total_usd: string;
    paid_usd: string;
    payment_status: string;
    order_status: string;
};

export type DashboardLowStockItem = {
    variant_id: number;
    product_name: string | null;
    sku: string | null;
    color: string | null;
    size: string | null;
    qty_on_hand: number;
};

export type DashboardPageProps = {
    summary: DashboardSummary;
    sales_trend: DashboardSalesTrendPoint[];
    payment_breakdown: DashboardPaymentBreakdown[];
    top_products: DashboardTopProduct[];
    recent_sales: DashboardRecentSale[];
    low_stock_watchlist: DashboardLowStockItem[];
};

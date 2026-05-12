import type { LaravelPaginator, ToastMessage } from '@/types/app';

export type InventoryFilters = {
    search?: string;
    product_variant_id?: string;
    type?: string;
};

export type InventoryCategory = {
    id: number;
    name: string;
    default_sale_price_usd?: string;
    description?: string | null;
    status: string;
};

export type InventorySupplier = {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address?: string | null;
    status: string;
};

export type InventoryStockBalance = {
    qty_on_hand: number;
};

export type InventoryProductVariant = {
    id: number;
    product_id: number;
    sku: string;
    style_name: string | null;
    color: string | null;
    size: string;
    sale_price_usd: string;
    status?: string;
    product?: Pick<InventoryProduct, 'id' | 'name'> | null;
    stock_balance?: InventoryStockBalance | null;
    stockBalance?: InventoryStockBalance | null;
};

export type InventoryProduct = {
    id: number;
    category_id: number;
    name: string;
    description: string | null;
    status: string;
    image_url?: string | null;
    category?: InventoryCategory | null;
    variants: InventoryProductVariant[];
};

export type InventoryPurchaseItem = {
    id: number;
    product_variant_id: number;
    qty?: number;
    unit_cost_usd?: string;
    landed_unit_cost_usd?: string;
    total_landed_cost_usd?: string;
    sale_price_usd?: string;
    expected_profit_per_unit_usd?: string;
    productVariant?: InventoryProductVariant;
};

export type InventoryPurchase = {
    id: number;
    purchase_no: string;
    purchase_date: string;
    total_cost_usd: string;
    status: string;
    supplier?: InventorySupplier | null;
    items: InventoryPurchaseItem[];
};

export type InventoryMovementReference = {
    id: number;
    type: string;
    label: string | null;
};

export type InventoryStockMovement = {
    id: number;
    type: string;
    product_variant_id: number;
    qty_change: number;
    unit_cost_usd: string;
    note: string | null;
    created_at: string;
    productVariant?: InventoryProductVariant;
    reference?: InventoryMovementReference | null;
};

export type InventoryIndexPageProps<T> = {
    filters: InventoryFilters;
    toast: ToastMessage;
} & T;

export type CategoryIndexPageProps = InventoryIndexPageProps<{
    categories: LaravelPaginator<InventoryCategory>;
}>;

export type SupplierIndexPageProps = InventoryIndexPageProps<{
    suppliers: LaravelPaginator<InventorySupplier>;
}>;

export type ProductIndexPageProps = InventoryIndexPageProps<{
    products: LaravelPaginator<InventoryProduct>;
}>;

export type PurchaseIndexPageProps = InventoryIndexPageProps<{
    purchases: LaravelPaginator<InventoryPurchase>;
}>;

export type StockIndexPageProps = InventoryIndexPageProps<{
    variants: LaravelPaginator<
        InventoryProductVariant & { product: InventoryProduct }
    >;
}>;

export type InventorySaleItemCostLayer = {
    qty: number;
    unit_cost_usd: string;
    total_cost_usd: string;
};

export type InventorySaleItem = {
    id: number;
    qty: number;
    unit_price_usd: string;
    discount_usd: string;
    total_usd: string;
    cogs_usd: string;
    profit_usd: string;
    product_variant?: {
        id: number;
        sku: string;
        color: string | null;
        size: string;
        product_name: string | null;
    } | null;
    cost_layers: InventorySaleItemCostLayer[];
};

export type InventorySaleReturnItem = {
    id: number;
    sale_item_id: number;
    qty: number;
    refund_usd: string;
};

export type InventorySaleReturn = {
    id: number;
    returned_at: string;
    total_refund_usd: string;
    note: string | null;
    items: InventorySaleReturnItem[];
};

export type InventorySale = {
    id: number;
    invoice_no: string;
    customer_name: string | null;
    customer_phone: string | null;
    sale_date: string;
    currency: string;
    exchange_rate: string;
    subtotal_usd: string;
    discount_usd: string;
    customer_delivery_fee_usd: string;
    actual_delivery_cost_usd: string;
    delivery_profit_usd: string;
    total_usd: string;
    paid_usd: string;
    payment_status: string;
    order_status: string;
    note: string | null;
    items: InventorySaleItem[];
    returns: InventorySaleReturn[];
};

export type SaleIndexPageProps = InventoryIndexPageProps<{
    sales: LaravelPaginator<InventorySale>;
}>;

export type SaleShowPageProps = {
    sale: InventorySale;
};

export type StockMovementIndexPageProps = InventoryIndexPageProps<{
    movements: LaravelPaginator<InventoryStockMovement>;
}>;

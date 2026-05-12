import type { LaravelPaginator, ToastMessage } from '@/types/app';

export type InventoryFilters = {
    search?: string;
    product_variant_id?: string;
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
    purchase_no?: string;
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

export type StockMovementIndexPageProps = InventoryIndexPageProps<{
    movements: LaravelPaginator<InventoryStockMovement>;
}>;

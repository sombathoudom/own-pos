export type IdName = { id: number; name: string };

export type Category = IdName;
export type Unit = IdName;

export type Product = {
    id: number;
    name: string;
    category_id?: number;
    unit_id?: number;
    category?: Category;
    unit?: Unit;
};

export type Invoice = {
    id: number;
    invoice_no: string;
    invoice_date: string;
};

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
};

export type IndexFilters = {
    search?: string;
    direction?: 'asc' | 'desc';
    per_page?: number;
};

export type FlashPayload =
    | {
          type: 'category';
          action: 'saved' | 'updated';
          data: Category;
          meta?: Record<string, any>;
      }
    | {
          type: 'unit';
          action: 'saved' | 'updated';
          data: Unit;
          meta?: Record<string, any>;
      }
    | {
          type: 'product';
          action: 'saved' | 'updated';
          data: Product;
          meta?: { line_index?: number | null };
      }
    | null;

export type InertiaFlash = {
    success?: string | null;
    error?: string | null;
    payload?: FlashPayload;
};

export type PageProps = {
    flash?: InertiaFlash;
};

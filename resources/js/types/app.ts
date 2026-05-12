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

import { useMemo, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';

export type PickerProduct = {
    id: number;
    name: string;
    category_id: number;
    image_url: string | null;
    variants: {
        id: number;
        product_id: number;
        sku: string;
        color: string | null;
        size: string;
        sale_price_usd: string;
    }[];
};

type Props = {
    products: PickerProduct[];
    excludeIds?: Set<string>;
    getCategoryName: (categoryId: number) => string;
    onSelect: (product: PickerProduct) => void;
};

export default function ProductSearchPicker({
    products,
    excludeIds = new Set(),
    getCategoryName,
    onSelect,
}: Props) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return products.filter((p) => {
            if (excludeIds.has(String(p.id))) return false;
            if (!term) return true;
            return (
                p.name.toLowerCase().includes(term) ||
                p.variants.some((v) => v.sku.toLowerCase().includes(term))
            );
        });
    }, [products, excludeIds, search]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open) {
            setOpen(true);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[highlightedIndex]) {
                select(filtered[highlightedIndex]);
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const select = (product: PickerProduct) => {
        onSelect(product);
        setSearch('');
        setOpen(false);
        setHighlightedIndex(0);
        inputRef.current?.focus();
    };

    return (
        <div className="position-relative">
            <Form.Control
                ref={inputRef}
                type="text"
                placeholder="Search by product name or SKU..."
                value={search}
                autoComplete="off"
                onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightedIndex(0);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onKeyDown={handleKeyDown}
            />

            {open && (
                <div
                    className="position-absolute w-100 rounded border bg-white shadow"
                    style={{ zIndex: 1050, maxHeight: 360, overflowY: 'auto' }}
                >
                    {filtered.length === 0 ? (
                        <div className="small px-3 py-2 text-muted">
                            {search
                                ? 'No products found.'
                                : 'Start typing to search...'}
                        </div>
                    ) : (
                        filtered.map((product, idx) => (
                            <button
                                key={product.id}
                                type="button"
                                className="d-flex align-items-center border-bottom w-100 gap-2 border-0 px-3 py-2 text-start"
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor:
                                        idx === highlightedIndex
                                            ? '#f0f7ff'
                                            : '#fff',
                                    transition: 'background-color 0.1s',
                                }}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    select(product);
                                }}
                            >
                                {/* Image */}
                                <div
                                    className="bg-light flex-shrink-0 overflow-hidden rounded border"
                                    style={{ width: 44, height: 44 }}
                                >
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="object-fit-cover h-100 w-100"
                                        />
                                    ) : (
                                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                            <i className="ri-image-line"></i>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-grow-1">
                                    <div className="fw-medium text-truncate">
                                        {product.name}
                                    </div>
                                    <div className="small text-muted">
                                        {getCategoryName(product.category_id)}{' '}
                                        &middot; {product.variants.length}{' '}
                                        variant
                                        {product.variants.length !== 1
                                            ? 's'
                                            : ''}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

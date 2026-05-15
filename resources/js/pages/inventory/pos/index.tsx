import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    type FormEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Modal,
    Offcanvas,
    Row,
} from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { store as salesStore } from '@/routes/sales';

type Variant = {
    id: number;
    sku: string;
    style_name: string | null;
    color: string | null;
    size: string;
    sale_price_usd: string;
    stock_on_hand: number;
    product: {
        id: number;
        name: string;
        category_id: number | null;
        category: string | null;
        image_url: string | null;
    };
};

type CartItem = {
    product_variant_id: number;
    qty: number;
    unit_price_usd: string;
    discount_usd: string;
};

type PosProps = {
    variants: Variant[];
    categories: Record<number, string>;
    sizes: string[];
    sourcePageOptions: string[];
};

function PosIndex() {
    const { variants, categories, sizes, sourcePageOptions } =
        usePage<PosProps>().props;

    const { data, setData, post, processing, errors } = useForm({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        source_page: 'Walk-in',
        sale_date: new Date().toISOString().split('T')[0],
        currency: 'USD',
        exchange_rate: '1',
        discount_usd: '0',
        customer_delivery_fee_usd: '0',
        actual_delivery_cost_usd: '0',
        paid_usd: '0',
        note: '',
        items: [] as CartItem[],
    });

    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
    const [activeSize, setActiveSize] = useState<string | 'all'>('all');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showCartMobile, setShowCartMobile] = useState(false);
    const [displayLimit, setDisplayLimit] = useState(30);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredVariants = useMemo(() => {
        return variants.filter((v) => {
            const matchesSearch =
                search.trim() === '' ||
                `${v.sku} ${v.product.name} ${v.color ?? ''} ${v.size} ${v.style_name ?? ''}`
                    .toLowerCase()
                    .includes(search.trim().toLowerCase());
            const matchesCategory =
                activeCategory === 'all' ||
                v.product.category_id === activeCategory;
            const matchesSize = activeSize === 'all' || v.size === activeSize;
            return matchesSearch && matchesCategory && matchesSize;
        });
    }, [variants, search, activeCategory, activeSize]);

    const displayedVariants = useMemo(() => {
        return filteredVariants.slice(0, displayLimit);
    }, [filteredVariants, displayLimit]);

    const hasMore = filteredVariants.length > displayLimit;

    useEffect(() => {
        setDisplayLimit(30);
    }, [search, activeCategory, activeSize]);

    const addToCart = (variant: Variant) => {
        const existing = data.items.find(
            (i) => i.product_variant_id === variant.id,
        );
        if (existing) {
            if (existing.qty >= variant.stock_on_hand) return;
            setData(
                'items',
                data.items.map((i) =>
                    i.product_variant_id === variant.id
                        ? { ...i, qty: i.qty + 1 }
                        : i,
                ),
            );
        } else {
            if (variant.stock_on_hand <= 0) return;
            setData('items', [
                ...data.items,
                {
                    product_variant_id: variant.id,
                    qty: 1,
                    unit_price_usd: variant.sale_price_usd,
                    discount_usd: '0',
                },
            ]);
        }
    };

    const updateQty = (variantId: number, delta: number) => {
        const variant = variants.find((v) => v.id === variantId);
        if (!variant) return;

        setData(
            'items',
            data.items.map((i) => {
                if (i.product_variant_id !== variantId) return i;
                const newQty = i.qty + delta;
                if (newQty <= 0) return i;
                if (newQty > variant.stock_on_hand) return i;
                return { ...i, qty: newQty };
            }),
        );
    };

    const setQty = (variantId: number, qty: number) => {
        const variant = variants.find((v) => v.id === variantId);
        if (!variant) return;
        const newQty = Math.max(1, Math.min(qty, variant.stock_on_hand));
        setData(
            'items',
            data.items.map((i) =>
                i.product_variant_id === variantId ? { ...i, qty: newQty } : i,
            ),
        );
    };

    const removeFromCart = (variantId: number) => {
        setData(
            'items',
            data.items.filter((i) => i.product_variant_id !== variantId),
        );
    };

    const updateCartPrice = (variantId: number, price: string) => {
        setData(
            'items',
            data.items.map((i) =>
                i.product_variant_id === variantId
                    ? { ...i, unit_price_usd: price }
                    : i,
            ),
        );
    };

    const updateCartDiscount = (variantId: number, discount: string) => {
        setData(
            'items',
            data.items.map((i) =>
                i.product_variant_id === variantId
                    ? { ...i, discount_usd: discount }
                    : i,
            ),
        );
    };

    const getVariant = (id: number) => variants.find((v) => v.id === id);

    const cartTotal = data.items.reduce((sum, item) => {
        const price = Number(item.unit_price_usd) || 0;
        const discount = Number(item.discount_usd) || 0;
        return sum + (item.qty * price - discount);
    }, 0);

    const deliveryFee = Number(data.customer_delivery_fee_usd) || 0;
    const discount = Number(data.discount_usd) || 0;
    const total = Math.max(0, cartTotal - discount + deliveryFee);
    const paid = Number(data.paid_usd) || 0;
    const change = Math.max(0, paid - total);
    const due = Math.max(0, total - paid);
    const totalQty = data.items.reduce((sum, i) => sum + i.qty, 0);

    const submitForm = () => {
        post(salesStore.url(), {
            onSuccess: () => {
                setShowCartMobile(false);
            },
            onError: (errs) => {
                console.error('Sale submission failed:', errs);
            },
        });
    };

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        submitForm();
    };

    const firstError = Object.values(errors).find(
        (e): e is string => typeof e === 'string',
    );

    const clearCart = () => {
        setData('items', []);
    };

    return (
        <>
            <Head title="POS" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="POS" pageTitle="Sales" />

                    <Form onSubmit={submit}>
                        {/* Hidden date field */}
                        <input
                            type="hidden"
                            name="sale_date"
                            value={data.sale_date}
                        />

                        <Row>
                            {/* Product Grid */}
                            <Col xl={8} lg={8} md={7}>
                                <Card className="mb-3">
                                    <Card.Body>
                                        {/* Search */}
                                        <div className="mb-3">
                                            <Form.Label className="fw-bold mb-2">
                                                <i className="ri-search-line me-2"></i>
                                                Search Products
                                            </Form.Label>
                                            <Form.Control
                                                ref={searchRef}
                                                type="text"
                                                placeholder="Search by name, SKU, color, size... (Press F2)"
                                                value={search}
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                                size="lg"
                                                className="shadow-sm"
                                                autoFocus
                                            />
                                        </div>

                                        {/* Category Filters */}
                                        <div className="d-flex mb-3 flex-wrap gap-2">
                                            <Button
                                                variant={
                                                    activeCategory === 'all'
                                                        ? 'primary'
                                                        : 'outline-primary'
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setActiveCategory('all')
                                                }
                                            >
                                                All
                                            </Button>
                                            {Object.entries(categories).map(
                                                ([id, name]) => (
                                                    <Button
                                                        key={id}
                                                        variant={
                                                            activeCategory ===
                                                            Number(id)
                                                                ? 'primary'
                                                                : 'outline-primary'
                                                        }
                                                        size="sm"
                                                        onClick={() =>
                                                            setActiveCategory(
                                                                Number(id),
                                                            )
                                                        }
                                                    >
                                                        {name}
                                                    </Button>
                                                ),
                                            )}
                                        </div>

                                        {/* Size Filters */}
                                        <div className="d-flex mb-3 flex-wrap gap-2">
                                            <Button
                                                variant={
                                                    activeSize === 'all'
                                                        ? 'secondary'
                                                        : 'outline-secondary'
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setActiveSize('all')
                                                }
                                            >
                                                All Sizes
                                            </Button>
                                            {sizes.map((size) => (
                                                <Button
                                                    key={size}
                                                    variant={
                                                        activeSize === size
                                                            ? 'secondary'
                                                            : 'outline-secondary'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setActiveSize(size)
                                                    }
                                                >
                                                    {size}
                                                </Button>
                                            ))}
                                        </div>

                                        {/* Product Grid */}
                                        <Row className="g-3">
                                            {displayedVariants.map(
                                                (variant) => {
                                                    const inCart =
                                                        data.items.find(
                                                            (i) =>
                                                                i.product_variant_id ===
                                                                variant.id,
                                                        );
                                                    const outOfStock =
                                                        variant.stock_on_hand <=
                                                        0;

                                                    return (
                                                        <Col
                                                            key={variant.id}
                                                            xs={6}
                                                            sm={4}
                                                            md={4}
                                                            lg={3}
                                                            xl={3}
                                                        >
                                                            <Card
                                                                className={`h-100 cursor-pointer transition-all ${outOfStock ? 'opacity-50' : ''} ${inCart ? 'border-2 border-primary shadow' : 'hover-shadow'}`}
                                                                onClick={() =>
                                                                    !outOfStock &&
                                                                    addToCart(
                                                                        variant,
                                                                    )
                                                                }
                                                                style={{
                                                                    cursor: outOfStock
                                                                        ? 'not-allowed'
                                                                        : 'pointer',
                                                                    transform:
                                                                        inCart
                                                                            ? 'scale(1.02)'
                                                                            : 'scale(1)',
                                                                    transition:
                                                                        'all 0.2s',
                                                                }}
                                                            >
                                                                {/* Product Image */}
                                                                <div
                                                                    className="position-relative rounded-top"
                                                                    style={{
                                                                        height: 160,
                                                                        backgroundColor:
                                                                            '#f8f9fa',
                                                                        overflow:
                                                                            'hidden',
                                                                    }}
                                                                >
                                                                    {variant
                                                                        .product
                                                                        .image_url ? (
                                                                        <img
                                                                            src={
                                                                                variant
                                                                                    .product
                                                                                    .image_url
                                                                            }
                                                                            alt={
                                                                                variant
                                                                                    .product
                                                                                    .name
                                                                            }
                                                                            className="h-100 w-100"
                                                                            style={{
                                                                                objectFit:
                                                                                    'cover',
                                                                            }}
                                                                            loading="lazy"
                                                                        />
                                                                    ) : (
                                                                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                                                            <i
                                                                                className="ri-image-line fs-1"
                                                                                style={{
                                                                                    opacity: 0.3,
                                                                                }}
                                                                            ></i>
                                                                        </div>
                                                                    )}
                                                                    {/* In Cart Badge - Large and Prominent */}
                                                                    {inCart && (
                                                                        <Badge
                                                                            bg="primary"
                                                                            className="position-absolute d-flex align-items-center justify-content-center end-0 top-0 m-2"
                                                                            style={{
                                                                                width: 40,
                                                                                height: 40,
                                                                                borderRadius:
                                                                                    '50%',
                                                                                fontSize:
                                                                                    '1.1rem',
                                                                                fontWeight:
                                                                                    'bold',
                                                                                boxShadow:
                                                                                    '0 2px 8px rgba(0,0,0,0.2)',
                                                                            }}
                                                                        >
                                                                            {
                                                                                inCart.qty
                                                                            }
                                                                        </Badge>
                                                                    )}
                                                                    {/* Stock Badge - Bottom Left */}
                                                                    <Badge
                                                                        bg={
                                                                            variant.stock_on_hand <=
                                                                            0
                                                                                ? 'dark'
                                                                                : variant.stock_on_hand <=
                                                                                    5
                                                                                  ? 'danger'
                                                                                  : variant.stock_on_hand <=
                                                                                      10
                                                                                    ? 'warning'
                                                                                    : 'success'
                                                                        }
                                                                        className="position-absolute start-0 bottom-0 m-2 px-2 py-1"
                                                                        style={{
                                                                            fontSize:
                                                                                '0.75rem',
                                                                            fontWeight:
                                                                                'bold',
                                                                        }}
                                                                    >
                                                                        <i className="ri-stack-line me-1"></i>
                                                                        {
                                                                            variant.stock_on_hand
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                                <Card.Body className="p-2">
                                                                    {/* Product Name */}
                                                                    <div
                                                                        className="fw-bold text-truncate mb-1"
                                                                        style={{
                                                                            fontSize:
                                                                                '0.9rem',
                                                                        }}
                                                                        title={
                                                                            variant
                                                                                .product
                                                                                .name
                                                                        }
                                                                    >
                                                                        {
                                                                            variant
                                                                                .product
                                                                                .name
                                                                        }
                                                                    </div>
                                                                    {/* SKU Badge */}
                                                                    <div className="mb-1">
                                                                        <Badge
                                                                            bg="secondary"
                                                                            className="font-monospace"
                                                                            style={{
                                                                                fontSize:
                                                                                    '0.7rem',
                                                                            }}
                                                                        >
                                                                            {
                                                                                variant.sku
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                    {/* Color & Size */}
                                                                    <div
                                                                        className="small d-flex align-items-center mb-2 gap-1 text-muted"
                                                                        style={{
                                                                            fontSize:
                                                                                '0.75rem',
                                                                        }}
                                                                    >
                                                                        {variant.color && (
                                                                            <>
                                                                                <span
                                                                                    className="d-inline-block rounded-circle"
                                                                                    style={{
                                                                                        width: 10,
                                                                                        height: 10,
                                                                                        backgroundColor:
                                                                                            variant.color,
                                                                                        border: '1px solid #dee2e6',
                                                                                    }}
                                                                                />
                                                                                <span>
                                                                                    {
                                                                                        variant.color
                                                                                    }
                                                                                </span>
                                                                                <span>
                                                                                    •
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                        <span className="fw-semibold">
                                                                            {
                                                                                variant.size
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    {/* Price */}
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <div
                                                                            className="fw-bold text-success"
                                                                            style={{
                                                                                fontSize:
                                                                                    '1.1rem',
                                                                            }}
                                                                        >
                                                                            $
                                                                            {Number(
                                                                                variant.sale_price_usd,
                                                                            ).toFixed(
                                                                                2,
                                                                            )}
                                                                        </div>
                                                                        {inCart && (
                                                                            <Badge
                                                                                bg="primary"
                                                                                className="px-2"
                                                                            >
                                                                                In
                                                                                Cart
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>
                                                    );
                                                },
                                            )}
                                            {filteredVariants.length === 0 && (
                                                <Col xs={12}>
                                                    <div className="py-5 text-center text-muted">
                                                        <i className="ri-search-line fs-1 d-block mb-2"></i>
                                                        No products found.
                                                    </div>
                                                </Col>
                                            )}
                                        </Row>

                                        {/* Load More */}
                                        {hasMore && (
                                            <div className="mt-3 text-center">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDisplayLimit(
                                                            (prev) => prev + 30,
                                                        )
                                                    }
                                                >
                                                    Load More (
                                                    {filteredVariants.length -
                                                        displayLimit}{' '}
                                                    remaining)
                                                </Button>
                                            </div>
                                        )}
                                        {!hasMore &&
                                            filteredVariants.length > 0 && (
                                                <div className="small mt-2 text-center text-muted">
                                                    Showing all{' '}
                                                    {filteredVariants.length}{' '}
                                                    products
                                                </div>
                                            )}
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Cart Panel */}
                            <Col xl={4} lg={4} md={5}>
                                <Card
                                    className="sticky-top mb-3"
                                    style={{ top: '1rem', zIndex: 1020 }}
                                >
                                    <Card.Body>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h4 className="card-title mb-0">
                                                <i className="ri-shopping-cart-2-line me-1"></i>
                                                Cart ({totalQty})
                                            </h4>
                                            {data.items.length > 0 && (
                                                <Button
                                                    variant="link"
                                                    className="text-danger p-0"
                                                    onClick={clearCart}
                                                >
                                                    Clear
                                                </Button>
                                            )}
                                        </div>

                                        {/* Customer */}
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div>
                                                    <span className="fw-semibold">
                                                        Customer
                                                    </span>
                                                    <div className="small text-muted">
                                                        Source:{' '}
                                                        {data.source_page}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="p-0"
                                                    onClick={() =>
                                                        setShowCustomerModal(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    {data.customer_name
                                                        ? 'Edit'
                                                        : 'Add'}
                                                </Button>
                                            </div>
                                            {data.customer_name ? (
                                                <div className="small">
                                                    <div className="fw-medium">
                                                        {data.customer_name}
                                                    </div>
                                                    {data.customer_phone && (
                                                        <div className="text-muted">
                                                            {
                                                                data.customer_phone
                                                            }
                                                        </div>
                                                    )}
                                                    {data.customer_address && (
                                                        <div className="text-muted">
                                                            {
                                                                data.customer_address
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="small text-muted">
                                                    Walk-in customer
                                                </div>
                                            )}

                                            <div className="mt-3">
                                                <Form.Label className="small mb-1 text-muted">
                                                    Source Page
                                                </Form.Label>
                                                <Form.Select
                                                    size="sm"
                                                    value={data.source_page}
                                                    onChange={(e) =>
                                                        setData(
                                                            'source_page',
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    {sourcePageOptions.map(
                                                        (option) => (
                                                            <option
                                                                key={option}
                                                                value={option}
                                                            >
                                                                {option}
                                                            </option>
                                                        ),
                                                    )}
                                                </Form.Select>
                                            </div>
                                        </div>

                                        {/* Cart Items */}
                                        <div
                                            className="vstack mb-3 gap-3"
                                            style={{
                                                maxHeight: 300,
                                                overflowY: 'auto',
                                            }}
                                        >
                                            {data.items.map((item) => {
                                                const variant = getVariant(
                                                    item.product_variant_id,
                                                );
                                                if (!variant) return null;

                                                return (
                                                    <div
                                                        key={
                                                            item.product_variant_id
                                                        }
                                                        className="rounded-3 bg-light border-2 border-primary p-3"
                                                        style={{
                                                            boxShadow:
                                                                '0 2px 6px rgba(13, 110, 253, 0.15)',
                                                        }}
                                                    >
                                                        {/* Product Header */}
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div className="me-2 flex-grow-1">
                                                                <div
                                                                    className="fw-bold mb-1"
                                                                    style={{
                                                                        fontSize:
                                                                            '0.95rem',
                                                                    }}
                                                                >
                                                                    {
                                                                        variant
                                                                            .product
                                                                            .name
                                                                    }
                                                                </div>
                                                                <div className="d-flex align-items-center flex-wrap gap-2">
                                                                    <Badge
                                                                        bg="secondary"
                                                                        className="font-monospace"
                                                                    >
                                                                        {
                                                                            variant.sku
                                                                        }
                                                                    </Badge>
                                                                    <span
                                                                        className="small text-muted"
                                                                        style={{
                                                                            fontSize:
                                                                                '0.75rem',
                                                                        }}
                                                                    >
                                                                        {
                                                                            variant.color
                                                                        }{' '}
                                                                        /{' '}
                                                                        {
                                                                            variant.size
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="link"
                                                                className="text-danger p-0"
                                                                onClick={() =>
                                                                    removeFromCart(
                                                                        item.product_variant_id,
                                                                    )
                                                                }
                                                            >
                                                                <i className="ri-delete-bin-line fs-5"></i>
                                                            </Button>
                                                        </div>

                                                        {/* Quantity Controls - Large and Prominent */}
                                                        <div className="mb-2">
                                                            <div className="small fw-semibold mb-1 text-muted">
                                                                QUANTITY
                                                            </div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <Button
                                                                    variant="primary"
                                                                    size="lg"
                                                                    className="px-3"
                                                                    onClick={() =>
                                                                        updateQty(
                                                                            item.product_variant_id,
                                                                            -1,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        item.qty <=
                                                                        1
                                                                    }
                                                                >
                                                                    <i className="ri-subtract-line"></i>
                                                                </Button>
                                                                <div
                                                                    className="flex-grow-1 rounded border border-2 border-primary bg-white py-2 text-center"
                                                                    style={{
                                                                        fontSize:
                                                                            '1.5rem',
                                                                        fontWeight:
                                                                            'bold',
                                                                        color: '#0d6efd',
                                                                    }}
                                                                >
                                                                    {item.qty}
                                                                </div>
                                                                <Button
                                                                    variant="primary"
                                                                    size="lg"
                                                                    className="px-3"
                                                                    onClick={() =>
                                                                        updateQty(
                                                                            item.product_variant_id,
                                                                            1,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        item.qty >=
                                                                        variant.stock_on_hand
                                                                    }
                                                                >
                                                                    <i className="ri-add-line"></i>
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Price & Discount */}
                                                        <div className="row g-2">
                                                            <div className="col-6">
                                                                <div className="small mb-1 text-muted">
                                                                    Unit Price
                                                                </div>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={
                                                                        item.unit_price_usd
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateCartPrice(
                                                                            item.product_variant_id,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="col-6">
                                                                <div className="small mb-1 text-muted">
                                                                    Discount
                                                                </div>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={
                                                                        item.discount_usd
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateCartDiscount(
                                                                            item.product_variant_id,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Item Total */}
                                                        <div className="border-top mt-2 pt-2">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <span className="text-muted">
                                                                    Item Total
                                                                </span>
                                                                <span
                                                                    className="fw-bold text-success"
                                                                    style={{
                                                                        fontSize:
                                                                            '1.25rem',
                                                                    }}
                                                                >
                                                                    $
                                                                    {(
                                                                        item.qty *
                                                                            Number(
                                                                                item.unit_price_usd,
                                                                            ) -
                                                                        Number(
                                                                            item.discount_usd,
                                                                        )
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {data.items.length === 0 && (
                                                <div className="py-4 text-center text-muted">
                                                    <i className="ri-shopping-cart-line fs-2 d-block mb-2"></i>
                                                    Click products to add
                                                </div>
                                            )}
                                        </div>

                                        {/* Totals */}
                                        <div className="vstack mb-3 gap-2">
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">
                                                    Subtotal
                                                </span>
                                                <span className="fw-semibold">
                                                    ${cartTotal.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted">
                                                    Discount
                                                </span>
                                                <Form.Control
                                                    size="sm"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.discount_usd}
                                                    onChange={(e) =>
                                                        setData(
                                                            'discount_usd',
                                                            e.target.value,
                                                        )
                                                    }
                                                    style={{ width: 80 }}
                                                />
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted">
                                                    Delivery
                                                </span>
                                                <Form.Control
                                                    size="sm"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={
                                                        data.customer_delivery_fee_usd
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'customer_delivery_fee_usd',
                                                            e.target.value,
                                                        )
                                                    }
                                                    style={{ width: 80 }}
                                                />
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted">
                                                    Actual Cost
                                                </span>
                                                <Form.Control
                                                    size="sm"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={
                                                        data.actual_delivery_cost_usd
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'actual_delivery_cost_usd',
                                                            e.target.value,
                                                        )
                                                    }
                                                    style={{ width: 80 }}
                                                />
                                            </div>

                                            <hr className="my-1" />

                                            <div className="d-flex justify-content-between">
                                                <span className="fw-bold">
                                                    Total
                                                </span>
                                                <span className="fw-bold fs-5">
                                                    ${total.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted">
                                                    Paid
                                                </span>
                                                <Form.Control
                                                    size="sm"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.paid_usd}
                                                    onChange={(e) =>
                                                        setData(
                                                            'paid_usd',
                                                            e.target.value,
                                                        )
                                                    }
                                                    style={{ width: 80 }}
                                                />
                                            </div>

                                            {due > 0 && (
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-danger">
                                                        Due
                                                    </span>
                                                    <span className="fw-bold text-danger">
                                                        ${due.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}

                                            {change > 0 && (
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-success">
                                                        Change
                                                    </span>
                                                    <span className="fw-bold text-success">
                                                        ${change.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {firstError && (
                                            <Alert
                                                variant="danger"
                                                className="small py-2"
                                            >
                                                {firstError}
                                            </Alert>
                                        )}

                                        <div className="d-grid gap-2">
                                            <Button
                                                type="button"
                                                variant="success"
                                                size="lg"
                                                disabled={
                                                    processing ||
                                                    data.items.length === 0
                                                }
                                                onClick={submitForm}
                                            >
                                                {processing
                                                    ? 'Processing...'
                                                    : 'Complete Sale'}
                                            </Button>
                                            <Link
                                                href="/sales"
                                                className="btn btn-outline-secondary"
                                            >
                                                View Sales
                                            </Link>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Form>
                </Container>
            </div>

            {/* Mobile Cart Button */}
            <Button
                variant="success"
                className="position-fixed d-md-none rounded-circle p-3 shadow"
                style={{ bottom: '1.5rem', right: '1.5rem', zIndex: 1030 }}
                onClick={() => setShowCartMobile(true)}
            >
                <i className="ri-shopping-cart-2-line fs-5"></i>
                {totalQty > 0 && (
                    <Badge
                        bg="danger"
                        className="position-absolute translate-middle rounded-circle start-100 top-0"
                    >
                        {totalQty}
                    </Badge>
                )}
            </Button>

            {/* Mobile Cart Offcanvas */}
            <Offcanvas
                show={showCartMobile}
                onHide={() => setShowCartMobile(false)}
                placement="end"
                className="d-md-none"
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        <i className="ri-shopping-cart-2-line me-1"></i>
                        Cart ({totalQty})
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column">
                    <div
                        className="flex-grow-1 overflow-auto"
                        style={{ maxHeight: '60vh' }}
                    >
                        {data.items.map((item) => {
                            const variant = getVariant(item.product_variant_id);
                            if (!variant) return null;
                            return (
                                <div
                                    key={item.product_variant_id}
                                    className="d-flex align-items-center mb-2 gap-2 rounded border p-2"
                                >
                                    <div className="min-w-0 flex-grow-1">
                                        <div
                                            className="fw-medium text-truncate"
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            {variant.product.name}
                                        </div>
                                        <div className="small text-muted">
                                            {variant.color} / {variant.size} /{' '}
                                            {variant.sku}
                                        </div>
                                        <div className="d-flex align-items-center mt-1 flex-wrap gap-2">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="px-2 py-0"
                                                onClick={() =>
                                                    updateQty(
                                                        item.product_variant_id,
                                                        -1,
                                                    )
                                                }
                                            >
                                                -
                                            </Button>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                min={1}
                                                max={variant.stock_on_hand}
                                                value={item.qty}
                                                onChange={(e) =>
                                                    setQty(
                                                        item.product_variant_id,
                                                        Number(e.target.value),
                                                    )
                                                }
                                                style={{
                                                    width: 50,
                                                    textAlign: 'center',
                                                }}
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="px-2 py-0"
                                                onClick={() =>
                                                    updateQty(
                                                        item.product_variant_id,
                                                        1,
                                                    )
                                                }
                                            >
                                                +
                                            </Button>
                                            <div className="d-flex flex-column">
                                                <span
                                                    className="text-muted"
                                                    style={{
                                                        fontSize: '0.65rem',
                                                    }}
                                                >
                                                    Price
                                                </span>
                                                <Form.Control
                                                    size="sm"
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unit_price_usd}
                                                    onChange={(e) =>
                                                        updateCartPrice(
                                                            item.product_variant_id,
                                                            e.target.value,
                                                        )
                                                    }
                                                    style={{ width: 70 }}
                                                />
                                            </div>
                                            <div className="d-flex flex-column">
                                                <span
                                                    className="text-muted"
                                                    style={{
                                                        fontSize: '0.65rem',
                                                    }}
                                                >
                                                    Disc
                                                </span>
                                                <Form.Control
                                                    size="sm"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={item.discount_usd}
                                                    onChange={(e) =>
                                                        updateCartDiscount(
                                                            item.product_variant_id,
                                                            e.target.value,
                                                        )
                                                    }
                                                    style={{ width: 60 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div
                                            className="fw-semibold"
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            $
                                            {(
                                                item.qty *
                                                    Number(
                                                        item.unit_price_usd,
                                                    ) -
                                                Number(item.discount_usd)
                                            ).toFixed(2)}
                                        </div>
                                        <Button
                                            variant="link"
                                            className="text-danger p-0"
                                            size="sm"
                                            onClick={() =>
                                                removeFromCart(
                                                    item.product_variant_id,
                                                )
                                            }
                                        >
                                            <i className="ri-delete-bin-line"></i>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                        {data.items.length === 0 && (
                            <div className="py-4 text-center text-muted">
                                <i className="ri-shopping-cart-line fs-2 d-block mb-2"></i>
                                Click products to add
                            </div>
                        )}
                    </div>

                    <div className="border-top mt-auto pt-3">
                        <div className="vstack mb-3 gap-2">
                            <div className="d-flex justify-content-between">
                                <span className="text-muted">Subtotal</span>
                                <span className="fw-semibold">
                                    ${cartTotal.toFixed(2)}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Discount</span>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.discount_usd}
                                    onChange={(e) =>
                                        setData('discount_usd', e.target.value)
                                    }
                                    style={{ width: 80 }}
                                />
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Delivery</span>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.customer_delivery_fee_usd}
                                    onChange={(e) =>
                                        setData(
                                            'customer_delivery_fee_usd',
                                            e.target.value,
                                        )
                                    }
                                    style={{ width: 80 }}
                                />
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Actual Cost</span>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.actual_delivery_cost_usd}
                                    onChange={(e) =>
                                        setData(
                                            'actual_delivery_cost_usd',
                                            e.target.value,
                                        )
                                    }
                                    style={{ width: 80 }}
                                />
                            </div>
                            <hr className="my-1" />
                            <div className="d-flex justify-content-between">
                                <span className="fw-bold">Total</span>
                                <span className="fw-bold fs-5">
                                    ${total.toFixed(2)}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Paid</span>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.paid_usd}
                                    onChange={(e) =>
                                        setData('paid_usd', e.target.value)
                                    }
                                    style={{ width: 80 }}
                                />
                            </div>
                            {due > 0 && (
                                <div className="d-flex justify-content-between">
                                    <span className="text-danger">Due</span>
                                    <span className="fw-bold text-danger">
                                        ${due.toFixed(2)}
                                    </span>
                                </div>
                            )}
                            {change > 0 && (
                                <div className="d-flex justify-content-between">
                                    <span className="text-success">Change</span>
                                    <span className="fw-bold text-success">
                                        ${change.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                        {firstError && (
                            <Alert variant="danger" className="small mb-2 py-2">
                                {firstError}
                            </Alert>
                        )}
                        <Button
                            variant="success"
                            size="lg"
                            className="w-100"
                            disabled={processing || data.items.length === 0}
                            onClick={submitForm}
                        >
                            {processing ? 'Processing...' : 'Complete Sale'}
                        </Button>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>

            {/* Customer Modal */}
            <Modal
                show={showCustomerModal}
                onHide={() => setShowCustomerModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Customer Info</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                            value={data.customer_name}
                            onChange={(e) =>
                                setData('customer_name', e.target.value)
                            }
                            placeholder="Customer name"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                            value={data.customer_phone}
                            onChange={(e) =>
                                setData('customer_phone', e.target.value)
                            }
                            placeholder="Phone number"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Source Page</Form.Label>
                        <Form.Select
                            value={data.source_page}
                            onChange={(e) =>
                                setData('source_page', e.target.value)
                            }
                        >
                            {sourcePageOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={data.customer_address}
                            onChange={(e) =>
                                setData('customer_address', e.target.value)
                            }
                            placeholder="Delivery address"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowCustomerModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setShowCustomerModal(false)}
                    >
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

PosIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default PosIndex;

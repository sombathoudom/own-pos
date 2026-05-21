import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Accordion,
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
import CustomerSelect from '@/Components/Inventory/CustomerSelect';
import DeliveryCompanyPicker from '@/Components/Inventory/DeliveryCompanyPicker';
import type { DeliveryCompanyOption } from '@/Components/Inventory/DeliveryCompanyPicker';
import Layout from '@/Layouts';
import { store as customersStore } from '@/routes/customers';
import { store as salesStore } from '@/routes/sales';
import type { InventoryCustomer } from '@/types';
import { getCurrentDate } from '@/utils/dateTime';

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
    customers: InventoryCustomer[];
    deliveryCompanies: DeliveryCompanyOption[];
    createdCustomer?: InventoryCustomer | null;
};

function PosIndex() {
    const {
        variants,
        categories,
        sizes,
        sourcePageOptions,
        customers,
        deliveryCompanies,
        createdCustomer,
    } = usePage<PosProps>().props;

    const { data, setData, post, processing, errors } = useForm({
        customer_id: createdCustomer?.id ?? null,
        print_receipt: true,
        from_pos: true,
        source_page: 'Walk-in',
        delivery_company_id: null as number | null,
        sale_date: getCurrentDate(),
        currency: 'USD',
        exchange_rate: '4100',
        discount_usd: '0',
        customer_delivery_fee_usd: '0',
        actual_delivery_cost_usd: '0',
        paid_usd: '0',
        note: '',
        items: [] as CartItem[],
    });

    const customerForm = useForm({
        name: '',
        phone: '',
        address: '',
        status: 'active',
        redirect_to: 'pos',
    });

    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
    const [activeSize, setActiveSize] = useState<string | 'all'>('all');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
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
            if (existing.qty >= variant.stock_on_hand) {
                return;
            }

            setData(
                'items',
                data.items.map((i) =>
                    i.product_variant_id === variant.id
                        ? { ...i, qty: i.qty + 1 }
                        : i,
                ),
            );
        } else {
            if (variant.stock_on_hand <= 0) {
                return;
            }

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

        if (!variant) {
            return;
        }

        setData(
            'items',
            data.items.map((i) => {
                if (i.product_variant_id !== variantId) {
                    return i;
                }

                const newQty = i.qty + delta;

                if (newQty <= 0) {
                    return i;
                }

                if (newQty > variant.stock_on_hand) {
                    return i;
                }

                return { ...i, qty: newQty };
            }),
        );
    };

    const setQty = (variantId: number, qty: number) => {
        const variant = variants.find((v) => v.id === variantId);

        if (!variant) {
            return;
        }

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
    const availableCustomers = useMemo(() => {
        if (!createdCustomer) {
            return customers;
        }

        const exists = customers.some(
            (customer) => customer.id === createdCustomer.id,
        );

        if (exists) {
            return customers;
        }

        return [...customers, createdCustomer].sort((left, right) =>
            left.name.localeCompare(right.name),
        );
    }, [customers, createdCustomer]);

    const selectedCustomer = useMemo(
        () =>
            availableCustomers.find(
                (customer) => customer.id === data.customer_id,
            ) ?? null,
        [availableCustomers, data.customer_id],
    );

    const submitForm = () => {
        post(salesStore.url(), {
            onSuccess: () => {
                setShowCartMobile(false);
                setShowPreviewModal(false);
            },
            onError: (errs) => {
                console.error('Sale submission failed:', errs);
                setShowPreviewModal(false);
            },
        });
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setShowPreviewModal(true);
    };

    const handleCompleteSale = () => {
        if (data.items.length === 0) {
            return;
        }

        setShowPreviewModal(true);
    };

    const firstError = Object.values(errors).find(
        (e): e is string => typeof e === 'string',
    );

    const clearCart = () => {
        setData('items', []);
    };

    const submitCustomerForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        customerForm.post(customersStore.url(), {
            preserveState: false,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="POS" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="POS" pageTitle="Sales" />

                    <Form onSubmit={submit}>
                        <input
                            type="hidden"
                            name="sale_date"
                            value={data.sale_date}
                        />

                        <Row className="g-3">
                            {/* ========== LEFT: PRODUCTS ========== */}
                            <Col
                                xl={8}
                                lg={8}
                                md={7}
                                className="d-flex flex-column"
                            >
                                {/* Search & Filters */}
                                <Card className="mb-3 shadow-sm border-0">
                                    <Card.Body className="p-3">
                                        {/* Search */}
                                        <div className="mb-2">
                                            <Form.Control
                                                ref={searchRef}
                                                type="text"
                                                placeholder="Search by name, SKU, color, size... (Press F2)"
                                                disabled={processing}
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
                                        <div className="d-flex mb-2 flex-wrap gap-1">
                                            <Button
                                                variant={
                                                    activeCategory === 'all'
                                                        ? 'primary'
                                                        : 'outline-primary'
                                                }
                                                size="sm"
                                                disabled={processing}
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
                                                        disabled={processing}
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
                                        <div className="d-flex flex-wrap gap-1">
                                            <Button
                                                variant={
                                                    activeSize === 'all'
                                                        ? 'secondary'
                                                        : 'outline-secondary'
                                                }
                                                size="sm"
                                                disabled={processing}
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
                                                    disabled={processing}
                                                    onClick={() =>
                                                        setActiveSize(size)
                                                    }
                                                >
                                                    {size}
                                                </Button>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>

                                {/* Products Grid */}
                                <Card className="shadow-sm border-0 flex-grow-1">
                                    <Card.Body className="p-2">
                                        <Row className="g-2">
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
                                                                className={`h-100 cursor-pointer shadow-sm ${outOfStock || processing ? 'opacity-50' : ''}`}
                                                                onClick={() =>
                                                                    !outOfStock &&
                                                                    !processing &&
                                                                    addToCart(
                                                                        variant,
                                                                    )
                                                                }
                                                                style={{
                                                                    cursor:
                                                                        outOfStock ||
                                                                        processing
                                                                            ? 'not-allowed'
                                                                            : 'pointer',
                                                                    transition:
                                                                        'all 0.2s ease',
                                                                    border: inCart
                                                                        ? '2px solid #0d6efd'
                                                                        : '1px solid #e9ecef',
                                                                    backgroundColor:
                                                                        inCart
                                                                            ? '#f0f7ff'
                                                                            : '#ffffff',
                                                                    boxShadow: inCart
                                                                        ? '0 0 0 3px rgba(13, 110, 253, 0.2), 0 2px 8px rgba(0,0,0,0.12)'
                                                                        : '0 1px 3px rgba(0,0,0,0.08)',
                                                                    transform:
                                                                        inCart
                                                                            ? 'scale(1.03)'
                                                                            : 'scale(1)',
                                                                }}
                                                            >
                                                                {/* Image */}
                                                                <div
                                                                    className="position-relative rounded-top"
                                                                    style={{
                                                                        height: 140,
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
                                                                                className="ri-image-line"
                                                                                style={{
                                                                                    fontSize:
                                                                                        '1.5rem',
                                                                                    opacity: 0.3,
                                                                                }}
                                                                            ></i>
                                                                        </div>
                                                                    )}
                                                                    {/* Stock Badge */}
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
                                                                        className="position-absolute start-0 bottom-0 m-1 px-1 py-0"
                                                                        style={{
                                                                            fontSize:
                                                                                '0.6rem',
                                                                        }}
                                                                    >
                                                                        {
                                                                            variant.stock_on_hand
                                                                        }
                                                                    </Badge>
                                                                    {/* In Cart Badge */}
                                                                    {inCart && (
                                                                        <Badge
                                                                            bg="primary"
                                                                            className="position-absolute end-0 top-0 m-1 d-flex align-items-center justify-content-center"
                                                                            style={{
                                                                                width: 22,
                                                                                height: 22,
                                                                                borderRadius:
                                                                                    '50%',
                                                                                fontSize:
                                                                                    '0.7rem',
                                                                            }}
                                                                        >
                                                                            {
                                                                                inCart.qty
                                                                            }
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <Card.Body className="p-2">
                                                                    <div
                                                                        className="fw-bold text-truncate"
                                                                        style={{
                                                                            fontSize:
                                                                                '0.8rem',
                                                                            lineHeight: 1.3,
                                                                        }}
                                                                    >
                                                                        {
                                                                            variant
                                                                                .product
                                                                                .name
                                                                        }
                                                                    </div>
                                                                    <div className="d-flex justify-content-between align-items-center mt-1">
                                                                        <Badge
                                                                            bg="secondary"
                                                                            className="font-monospace"
                                                                            style={{
                                                                                fontSize:
                                                                                    '0.6rem',
                                                                            }}
                                                                        >
                                                                            {
                                                                                variant.sku
                                                                            }
                                                                        </Badge>
                                                                        <span
                                                                            className="fw-bold text-success"
                                                                            style={{
                                                                                fontSize:
                                                                                    '0.8rem',
                                                                            }}
                                                                        >
                                                                            $
                                                                            {Number(
                                                                                variant.sale_price_usd,
                                                                            ).toFixed(
                                                                                2,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="d-flex align-items-center gap-1 mt-1">
                                                                        {variant.color && (
                                                                            <span
                                                                                className="text-muted"
                                                                                style={{
                                                                                    fontSize:
                                                                                        '0.7rem',
                                                                                }}
                                                                            >
                                                                                {
                                                                                    variant.color
                                                                                }
                                                                            </span>
                                                                        )}
                                                                        <Badge
                                                                            bg="light"
                                                                            text="dark"
                                                                            style={{
                                                                                fontSize:
                                                                                    '0.65rem',
                                                                            }}
                                                                        >
                                                                            {
                                                                                variant.size
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>
                                                    );
                                                },
                                            )}
                                            {displayedVariants.length ===
                                                0 && (
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
                                                    disabled={processing}
                                                    onClick={() =>
                                                        setDisplayLimit(
                                                            (prev) =>
                                                                prev + 30,
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

                            {/* ========== RIGHT: CART (Desktop) ========== */}
                            <Col
                                xl={4}
                                lg={4}
                                md={5}
                                className="d-none d-md-block"
                            >
                                <Card
                                    className="shadow border-primary border-2"
                                    style={{
                                        position: 'sticky',
                                        top: '1rem',
                                        height: 'calc(100vh - 2rem)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Card.Body
                                        className="d-flex flex-column p-0"
                                        style={{ height: '100%' }}
                                    >
                                        {/* Header */}
                                        <div className="p-2 border-bottom bg-primary text-white flex-shrink-0">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="ri-shopping-cart-2-line fs-5"></i>
                                                    <span className="fw-bold">
                                                        Cart ({totalQty})
                                                    </span>
                                                </div>
                                                {data.items.length > 0 && (
                                                    <Button
                                                        variant="light"
                                                        size="sm"
                                                        className="text-danger py-0 px-2"
                                                        onClick={clearCart}
                                                        disabled={processing}
                                                    >
                                                        Clear
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Customer */}
                                        <div className="p-2 border-bottom flex-shrink-0">
                                            <Row className="g-2">
                                                <Col xs={8}>
                                                    <CustomerSelect
                                                        customers={
                                                            availableCustomers
                                                        }
                                                        value={data.customer_id}
                                                        onChange={(
                                                            customerId,
                                                        ) =>
                                                            setData(
                                                                'customer_id',
                                                                customerId,
                                                            )
                                                        }
                                                        inputId="customer_id"
                                                        placeholder="Search customer"
                                                        disabled={processing}
                                                    />
                                                </Col>
                                                <Col xs={4}>
                                                    <Button
                                                        size="sm"
                                                        className="w-100"
                                                        onClick={() =>
                                                            setShowCustomerModal(
                                                                true,
                                                            )
                                                        }
                                                        disabled={processing}
                                                    >
                                                        + Customer
                                                    </Button>
                                                </Col>
                                            </Row>
                                            <div className="mt-1 d-flex justify-content-between align-items-center">
                                                <span
                                                    className="text-muted"
                                                    style={{
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    Source: {data.source_page}
                                                </span>
                                                <Form.Select
                                                    size="sm"
                                                    disabled={processing}
                                                    value={data.source_page}
                                                    onChange={(e) =>
                                                        setData(
                                                            'source_page',
                                                            e.target.value,
                                                        )
                                                    }
                                                    style={{ width: 120 }}
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
                                            className="flex-grow-1 overflow-auto p-2"
                                            style={{ minHeight: '120px' }}
                                        >
                                            {data.items.length > 0 ? (
                                                data.items.map((item) => {
                                                    const variant = getVariant(
                                                        item.product_variant_id,
                                                    );

                                                    if (!variant) {
                                                        return null;
                                                    }

                                                    const itemTotal =
                                                        item.qty *
                                                            Number(
                                                                item.unit_price_usd,
                                                            ) -
                                                        Number(
                                                            item.discount_usd,
                                                        );

                                                    return (
                                                        <div
                                                            key={
                                                                item.product_variant_id
                                                            }
                                                            className="d-flex align-items-center gap-2 mb-2 p-2 rounded border bg-white"
                                                        >
                                                            <div className="flex-grow-1 min-w-0">
                                                                <div
                                                                    className="fw-semibold text-truncate"
                                                                    style={{
                                                                        fontSize:
                                                                            '0.8rem',
                                                                    }}
                                                                >
                                                                    {
                                                                        variant
                                                                            .product
                                                                            .name
                                                                    }
                                                                </div>
                                                                <div
                                                                    className="text-muted"
                                                                    style={{
                                                                        fontSize:
                                                                            '0.7rem',
                                                                    }}
                                                                >
                                                                    {
                                                                        variant.sku
                                                                    }{' '}
                                                                    •{' '}
                                                                    {variant.color}{' '}
                                                                    /{' '}
                                                                    {
                                                                        variant.size
                                                                    }
                                                                </div>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    size="sm"
                                                                    className="px-2 py-0"
                                                                    style={{
                                                                        fontSize:
                                                                            '0.8rem',
                                                                    }}
                                                                    onClick={() =>
                                                                        updateQty(
                                                                            item.product_variant_id,
                                                                            -1,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        processing ||
                                                                        item.qty <=
                                                                            1
                                                                    }
                                                                >
                                                                    -
                                                                </Button>
                                                                <span
                                                                    className="fw-bold"
                                                                    style={{
                                                                        minWidth: 20,
                                                                        textAlign:
                                                                            'center',
                                                                        fontSize:
                                                                            '0.85rem',
                                                                    }}
                                                                >
                                                                    {item.qty}
                                                                </span>
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    size="sm"
                                                                    className="px-2 py-0"
                                                                    style={{
                                                                        fontSize:
                                                                            '0.8rem',
                                                                    }}
                                                                    onClick={() =>
                                                                        updateQty(
                                                                            item.product_variant_id,
                                                                            1,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        processing ||
                                                                        item.qty >=
                                                                            variant.stock_on_hand
                                                                    }
                                                                >
                                                                    +
                                                                </Button>
                                                            </div>
                                                            <div
                                                                className="text-end flex-shrink-0"
                                                                style={{
                                                                    minWidth: 55,
                                                                }}
                                                            >
                                                                <div
                                                                    className="fw-bold text-success"
                                                                    style={{
                                                                        fontSize:
                                                                            '0.8rem',
                                                                    }}
                                                                >
                                                                    $
                                                                    {itemTotal.toFixed(
                                                                        2,
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className="text-danger p-0"
                                                                    style={{
                                                                        fontSize:
                                                                            '0.75rem',
                                                                    }}
                                                                    onClick={() =>
                                                                        removeFromCart(
                                                                            item.product_variant_id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        processing
                                                                    }
                                                                >
                                                                    <i className="ri-delete-bin-line"></i>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                                                    <i className="ri-shopping-cart-line fs-2 mb-2"></i>
                                                    <span className="small">
                                                        Click products to add
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Totals */}
                                        <div
                                            className="p-2 border-top bg-light flex-shrink-0"
                                            style={{
                                                maxHeight: '200px',
                                                overflow: 'auto',
                                            }}
                                        >
                                            <div className="vstack gap-1">
                                                <div className="d-flex justify-content-between small">
                                                    <span className="text-muted">
                                                        Subtotal
                                                    </span>
                                                    <span>
                                                        ${cartTotal.toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center small">
                                                    <span className="text-muted">
                                                        Discount
                                                    </span>
                                                    <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        disabled={processing}
                                                        value={data.discount_usd}
                                                        onChange={(e) =>
                                                            setData(
                                                                'discount_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                        style={{
                                                            width: 70,
                                                            padding:
                                                                '0.15rem 0.3rem',
                                                        }}
                                                    />
                                                </div>

                                                <div className="small">
                                                    <Form.Label
                                                        className="mb-0 text-muted"
                                                        style={{
                                                            fontSize: '0.75rem',
                                                        }}
                                                    >
                                                        Delivery
                                                    </Form.Label>
                                                    <DeliveryCompanyPicker
                                                        companies={
                                                            deliveryCompanies
                                                        }
                                                        selectedId={
                                                            data.delivery_company_id
                                                        }
                                                        disabled={processing}
                                                        onChange={(company) => {
                                                            setData(
                                                                'delivery_company_id',
                                                                company?.id ??
                                                                    null,
                                                            );

                                                            if (company) {
                                                                setData(
                                                                    'actual_delivery_cost_usd',
                                                                    company.delivery_cost_usd,
                                                                );

                                                                if (
                                                                    !data.customer_delivery_fee_usd ||
                                                                    data.customer_delivery_fee_usd ===
                                                                        '0'
                                                                ) {
                                                                    setData(
                                                                        'customer_delivery_fee_usd',
                                                                        company.delivery_cost_usd,
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                        customerDeliveryFee={
                                                            Number(
                                                                data.customer_delivery_fee_usd,
                                                            ) || 0
                                                        }
                                                    />
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center small">
                                                    <span className="fw-semibold">
                                                        Delivery Fee
                                                    </span>
                                                    <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        disabled={processing}
                                                        value={
                                                            data.customer_delivery_fee_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'customer_delivery_fee_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                        style={{
                                                            width: 70,
                                                            padding:
                                                                '0.15rem 0.3rem',
                                                        }}
                                                    />
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center small">
                                                    <span className="text-muted">
                                                        Actual Cost
                                                    </span>
                                                    <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        disabled={processing}
                                                        value={
                                                            data.actual_delivery_cost_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'actual_delivery_cost_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                        style={{
                                                            width: 70,
                                                            padding:
                                                                '0.15rem 0.3rem',
                                                        }}
                                                    />
                                                </div>

                                                <hr className="my-1" />

                                                <div className="d-flex justify-content-between">
                                                    <span className="fw-bold small">
                                                        Total
                                                    </span>
                                                    <span className="fw-bold small">
                                                        ${total.toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center small">
                                                    <span className="text-muted">
                                                        Paid
                                                    </span>
                                                    <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        disabled={processing}
                                                        value={data.paid_usd}
                                                        onChange={(e) =>
                                                            setData(
                                                                'paid_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                        style={{
                                                            width: 70,
                                                            padding:
                                                                '0.15rem 0.3rem',
                                                        }}
                                                    />
                                                </div>

                                                {due > 0 && (
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-danger small">
                                                            Due
                                                        </span>
                                                        <span className="fw-bold text-danger small">
                                                            ${due.toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}

                                                {change > 0 && (
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-success small">
                                                            Change
                                                        </span>
                                                        <span className="fw-bold text-success small">
                                                            ${change.toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Complete Sale Button */}
                                        <div className="p-2 border-top flex-shrink-0">
                                            {firstError && (
                                                <Alert
                                                    variant="danger"
                                                    className="small py-1 px-2 mb-2"
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
                                                        data.items.length ===
                                                            0
                                                    }
                                                    onClick={
                                                        handleCompleteSale
                                                    }
                                                >
                                                    {processing
                                                        ? 'Processing...'
                                                        : 'Complete Sale'}
                                                </Button>
                                                <Link
                                                    href="/sales"
                                                    className="btn btn-outline-secondary btn-sm"
                                                >
                                                    View Sales
                                                </Link>
                                            </div>
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
                        style={{ minHeight: 0 }}
                    >
                        {data.items.map((item) => {
                            const variant = getVariant(item.product_variant_id);

                            if (!variant) {
                                return null;
                            }

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
                                                disabled={processing}
                                            >
                                                -
                                            </Button>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                min={1}
                                                max={variant.stock_on_hand}
                                                disabled={processing}
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
                                                disabled={processing}
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
                                                    disabled={processing}
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
                                                    disabled={processing}
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
                                            disabled={processing}
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
                                    disabled={processing}
                                    value={data.discount_usd}
                                    onChange={(e) =>
                                        setData('discount_usd', e.target.value)
                                    }
                                    style={{ width: 80 }}
                                />
                            </div>
                            <div className="mb-2">
                                <Form.Label className="small mb-1 text-muted">
                                    Delivery Company
                                </Form.Label>
                                <DeliveryCompanyPicker
                                    companies={deliveryCompanies}
                                    selectedId={data.delivery_company_id}
                                    disabled={processing}
                                    onChange={(company) => {
                                        setData(
                                            'delivery_company_id',
                                            company?.id ?? null,
                                        );

                                        if (company) {
                                            setData(
                                                'actual_delivery_cost_usd',
                                                company.delivery_cost_usd,
                                            );
                                        }
                                    }}
                                    customerDeliveryFee={
                                        Number(
                                            data.customer_delivery_fee_usd,
                                        ) || 0
                                    }
                                />
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span
                                    className="fw-semibold"
                                    style={{ fontSize: '0.95rem' }}
                                >
                                    Delivery Fee
                                </span>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    disabled={processing}
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
                                    disabled={processing}
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
                                    disabled={processing}
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
                            onClick={handleCompleteSale}
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
                    <Modal.Title>Add Customer</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={submitCustomerForm}>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                value={customerForm.data.name}
                                onChange={(event) =>
                                    customerForm.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                placeholder="Customer name"
                                isInvalid={!!customerForm.errors.name}
                            />
                            <Form.Control.Feedback
                                type="invalid"
                                className="d-block"
                            >
                                {customerForm.errors.name}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control
                                value={customerForm.data.phone}
                                onChange={(event) =>
                                    customerForm.setData(
                                        'phone',
                                        event.target.value,
                                    )
                                }
                                placeholder="Phone number"
                                isInvalid={!!customerForm.errors.phone}
                            />
                            <Form.Control.Feedback
                                type="invalid"
                                className="d-block"
                            >
                                {customerForm.errors.phone}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={customerForm.data.address}
                                onChange={(event) =>
                                    customerForm.setData(
                                        'address',
                                        event.target.value,
                                    )
                                }
                                placeholder="Delivery address"
                                isInvalid={!!customerForm.errors.address}
                            />
                            <Form.Control.Feedback
                                type="invalid"
                                className="d-block"
                            >
                                {customerForm.errors.address}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button
                                type="button"
                                variant="light"
                                onClick={() => setShowCustomerModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={customerForm.processing}
                            >
                                {customerForm.processing
                                    ? 'Saving...'
                                    : 'Create Customer'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Sale Preview Modal */}
            <Modal
                show={showPreviewModal}
                onHide={() => setShowPreviewModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="ri-file-list-3-line me-2"></i>
                        Review Sale
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Customer Info */}
                    <div className="mb-4">
                        <h6 className="mb-2 text-muted">
                            Customer Information
                        </h6>
                        <div className="bg-light rounded p-3">
                            {selectedCustomer ? (
                                <>
                                    <div className="fw-semibold">
                                        {selectedCustomer.name}
                                    </div>
                                    {selectedCustomer.phone && (
                                        <div className="small text-muted">
                                            <i className="ri-phone-line me-1"></i>
                                            {selectedCustomer.phone}
                                        </div>
                                    )}
                                    {selectedCustomer.address && (
                                        <div className="small text-muted">
                                            <i className="ri-map-pin-line me-1"></i>
                                            {selectedCustomer.address}
                                        </div>
                                    )}
                                    <div className="small mt-1 text-muted">
                                        <i className="ri-store-line me-1"></i>
                                        Source: {data.source_page}
                                    </div>
                                </>
                            ) : (
                                <div className="text-muted">
                                    <i className="ri-user-line me-1"></i>
                                    Walk-in Customer • {data.source_page}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items */}
                    <div className="mb-4">
                        <h6 className="mb-2 text-muted">
                            Items ({data.items.length})
                        </h6>
                        <div className="rounded border">
                            {data.items.map((item, index) => {
                                const variant = getVariant(
                                    item.product_variant_id,
                                );

                                if (!variant) {
                                    return null;
                                }

                                const itemSubtotal =
                                    item.qty * Number(item.unit_price_usd);
                                const itemDiscount = Number(item.discount_usd);
                                const itemTotal = itemSubtotal - itemDiscount;

                                return (
                                    <div
                                        key={item.product_variant_id}
                                        className={`p-3 ${index > 0 ? 'border-top' : ''}`}
                                    >
                                        <div className="d-flex align-items-start gap-3">
                                            {/* Product Image */}
                                            <div
                                                className="rounded-3 bg-light d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden border"
                                                style={{
                                                    width: 80,
                                                    height: 80,
                                                }}
                                            >
                                                {variant.product.image_url ? (
                                                    <img
                                                        src={
                                                            variant.product
                                                                .image_url
                                                        }
                                                        alt={
                                                            variant.product.name
                                                        }
                                                        className="h-100 w-100"
                                                        style={{
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                ) : (
                                                    <i
                                                        className="ri-image-line text-muted"
                                                        style={{
                                                            fontSize: '2rem',
                                                            opacity: 0.3,
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-grow-1">
                                                <div className="fw-semibold fs-6">
                                                    {variant.product.name}
                                                </div>
                                                <div className="d-flex align-items-center mb-2 gap-2">
                                                    <Badge
                                                        bg="secondary"
                                                        className="font-monospace"
                                                    >
                                                        {variant.sku}
                                                    </Badge>
                                                    <span className="small text-muted">
                                                        {variant.color} /{' '}
                                                        {variant.size}
                                                    </span>
                                                </div>
                                                <div className="small">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span className="text-muted">
                                                            Quantity
                                                        </span>
                                                        <Badge
                                                            bg="primary"
                                                            className="fs-6 px-3 py-2"
                                                        >
                                                            {item.qty}
                                                        </Badge>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="text-muted">
                                                            Unit Price
                                                        </span>
                                                        <span>
                                                            $
                                                            {Number(
                                                                item.unit_price_usd,
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    {itemDiscount > 0 && (
                                                        <div className="d-flex justify-content-between text-danger">
                                                            <span>
                                                                Discount
                                                            </span>
                                                            <span>
                                                                -$
                                                                {itemDiscount.toFixed(
                                                                    2,
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Item Total */}
                                            <div className="flex-shrink-0 text-end">
                                                <div className="fw-bold fs-4 text-success">
                                                    ${itemTotal.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-light rounded p-3">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Subtotal</span>
                            <span className="fw-semibold">
                                ${cartTotal.toFixed(2)}
                            </span>
                        </div>
                        {discount > 0 && (
                            <div className="d-flex justify-content-between text-danger mb-2">
                                <span>Discount</span>
                                <span>-${discount.toFixed(2)}</span>
                            </div>
                        )}
                        {deliveryFee > 0 && (
                            <div className="d-flex justify-content-between mb-2">
                                <span
                                    className="fw-semibold"
                                    style={{ fontSize: '0.95rem' }}
                                >
                                    Delivery Fee
                                </span>
                                <span>${deliveryFee.toFixed(2)}</span>
                            </div>
                        )}
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between mb-3">
                            <span className="fw-bold fs-5">Total</span>
                            <span className="fw-bold fs-4 text-primary">
                                ${total.toFixed(2)}
                            </span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Paid</span>
                            <span className="fw-semibold text-success">
                                ${paid.toFixed(2)}
                            </span>
                        </div>
                        {due > 0 && (
                            <div className="d-flex justify-content-between">
                                <span className="text-danger fw-semibold">
                                    Amount Due
                                </span>
                                <span className="fw-bold text-danger fs-5">
                                    ${due.toFixed(2)}
                                </span>
                            </div>
                        )}
                        {change > 0 && (
                            <div className="d-flex justify-content-between">
                                <span className="text-success fw-semibold">
                                    Change
                                </span>
                                <span className="fw-bold text-success fs-5">
                                    ${change.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>

                    {firstError && (
                        <Alert variant="danger" className="mt-3 mb-0">
                            {firstError}
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowPreviewModal(false)}
                        disabled={processing}
                    >
                        <i className="ri-arrow-left-line me-1"></i>
                        Back to Edit
                    </Button>
                    <Button
                        variant="success"
                        size="lg"
                        onClick={submitForm}
                        disabled={processing || data.items.length === 0}
                    >
                        {processing ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <i className="ri-check-line me-1"></i>
                                Confirm & Complete Sale
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

PosIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default PosIndex;

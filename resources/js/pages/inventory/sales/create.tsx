import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type ReactNode, useMemo, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
} from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { store as salesStore, index as salesIndex } from '@/routes/sales';
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
        category: string | null;
    };
};

type CartItem = {
    product_variant_id: number;
    qty: string;
    unit_price_usd: string;
    discount_usd: string;
};

type FormData = {
    customer_name: string;
    customer_phone: string;
    source_page: string;
    sale_date: string;
    currency: string;
    exchange_rate: string;
    discount_usd: string;
    customer_delivery_fee_usd: string;
    actual_delivery_cost_usd: string;
    paid_usd: string;
    note: string;
    items: CartItem[];
};

type SalesCreateProps = {
    variants: Variant[];
    invoiceNo: string;
    sourcePageOptions: string[];
};

function SalesCreate() {
    const { variants, invoiceNo, sourcePageOptions } =
        usePage<SalesCreateProps>().props;

    const { data, setData, post, processing, errors } = useForm<FormData>({
        customer_name: '',
        customer_phone: '',
        source_page: 'Other',
        sale_date: getCurrentDate(),
        currency: 'USD',
        exchange_rate: '1',
        discount_usd: '0',
        customer_delivery_fee_usd: '0',
        actual_delivery_cost_usd: '0',
        paid_usd: '0',
        note: '',
        items: [],
    });

    const [search, setSearch] = useState('');
    const [showPicker, setShowPicker] = useState(false);

    const filteredVariants = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return variants.slice(0, 20);
        return variants.filter((v) => {
            const text =
                `${v.sku} ${v.product.name} ${v.color ?? ''} ${v.size} ${v.style_name ?? ''}`.toLowerCase();
            return text.includes(term);
        });
    }, [variants, search]);

    const selectedVariantIds = useMemo(
        () => new Set(data.items.map((i) => i.product_variant_id)),
        [data.items],
    );

    const addVariant = (variant: Variant) => {
        if (selectedVariantIds.has(variant.id)) return;
        if (variant.stock_on_hand <= 0) return;

        setData('items', [
            ...data.items,
            {
                product_variant_id: variant.id,
                qty: '1',
                unit_price_usd: variant.sale_price_usd,
                discount_usd: '0',
            },
        ]);
        setSearch('');
        setShowPicker(false);
    };

    const removeItem = (index: number) => {
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    };

    const updateItem = (
        index: number,
        field: keyof CartItem,
        value: string,
    ) => {
        const updated = [...data.items];
        updated[index] = { ...updated[index], [field]: value };
        setData('items', updated);
    };

    const getVariant = (variantId: number): Variant | undefined => {
        return variants.find((v) => v.id === variantId);
    };

    const itemTotal = (item: CartItem): number => {
        const qty = Number(item.qty) || 0;
        const price = Number(item.unit_price_usd) || 0;
        const discount = Number(item.discount_usd) || 0;
        return Math.max(0, qty * price - discount);
    };

    const subtotal = data.items.reduce((sum, item) => sum + itemTotal(item), 0);
    const discount = Number(data.discount_usd) || 0;
    const deliveryFee = Number(data.customer_delivery_fee_usd) || 0;
    const total = Math.max(0, subtotal - discount + deliveryFee);
    const paid = Number(data.paid_usd) || 0;
    const due = Math.max(0, total - paid);

    const totalQty = data.items.reduce(
        (sum, item) => sum + (Number(item.qty) || 0),
        0,
    );

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(salesStore.url());
    };

    const variantLabel = (variant: Variant): string => {
        const parts = [
            variant.product.name,
            variant.color,
            variant.size,
            variant.style_name,
        ].filter(Boolean);
        return parts.join(' / ');
    };

    return (
        <>
            <Head title="New Sale" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="New Sale" pageTitle="Sales" />

                    <Form onSubmit={submit}>
                        <Row>
                            <Col xl={8}>
                                <Card className="mb-3">
                                    <Card.Body>
                                        <h4 className="card-title mb-3">
                                            Sale Details
                                        </h4>
                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Customer Name
                                                    </Form.Label>
                                                    <Form.Control
                                                        value={
                                                            data.customer_name
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'customer_name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.customer_name
                                                        }
                                                        placeholder="Optional"
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.customer_name}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Customer Phone
                                                    </Form.Label>
                                                    <Form.Control
                                                        value={
                                                            data.customer_phone
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'customer_phone',
                                                                e.target.value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.customer_phone
                                                        }
                                                        placeholder="Optional"
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.customer_phone}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Source Page
                                                    </Form.Label>
                                                    <Form.Select
                                                        value={data.source_page}
                                                        onChange={(e) =>
                                                            setData(
                                                                'source_page',
                                                                e.target.value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.source_page
                                                        }
                                                    >
                                                        {sourcePageOptions.map(
                                                            (option) => (
                                                                <option
                                                                    key={option}
                                                                    value={
                                                                        option
                                                                    }
                                                                >
                                                                    {option}
                                                                </option>
                                                            ),
                                                        )}
                                                    </Form.Select>
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.source_page}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Sale Date
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={data.sale_date}
                                                        onChange={(e) =>
                                                            setData(
                                                                'sale_date',
                                                                e.target.value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.sale_date
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.sale_date}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Exchange Rate
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.0001"
                                                        min="0"
                                                        value={
                                                            data.exchange_rate
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'exchange_rate',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </Col>
                                            <Col lg={8}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Note
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={1}
                                                        value={data.note}
                                                        onChange={(e) =>
                                                            setData(
                                                                'note',
                                                                e.target.value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.note
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.note}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="mb-3">
                                    <Card.Body>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h4 className="card-title mb-0">
                                                Items
                                            </h4>
                                            <span className="small text-muted">
                                                {data.items.length} item
                                                {data.items.length !== 1
                                                    ? 's'
                                                    : ''}
                                            </span>
                                        </div>

                                        {(() => {
                                            const itemsErr = (
                                                errors as Record<
                                                    string,
                                                    unknown
                                                >
                                            ).items;
                                            if (!itemsErr) return null;
                                            return (
                                                <Alert
                                                    variant="danger"
                                                    className="mb-3"
                                                >
                                                    {typeof itemsErr ===
                                                    'string'
                                                        ? itemsErr
                                                        : 'Please check your items.'}
                                                </Alert>
                                            );
                                        })()}

                                        {/* Variant Search */}
                                        <div className="position-relative mb-4">
                                            <Form.Label className="fw-semibold mb-2">
                                                <i className="ri-search-line me-1"></i>
                                                Search Products
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Search by SKU, product name, color, size..."
                                                value={search}
                                                onChange={(e) => {
                                                    setSearch(e.target.value);
                                                    setShowPicker(true);
                                                }}
                                                onFocus={() =>
                                                    setShowPicker(true)
                                                }
                                                autoComplete="off"
                                                size="lg"
                                                className="shadow-sm"
                                            />
                                            {showPicker &&
                                                filteredVariants.length > 0 && (
                                                    <div
                                                        className="position-absolute rounded-3 w-100 border bg-white shadow"
                                                        style={{
                                                            zIndex: 1000,
                                                            maxHeight: 400,
                                                            overflowY: 'auto',
                                                        }}
                                                    >
                                                        {filteredVariants.map(
                                                            (variant) => {
                                                                const inCart =
                                                                    selectedVariantIds.has(
                                                                        variant.id,
                                                                    );
                                                                const outOfStock =
                                                                    variant.stock_on_hand <=
                                                                    0;
                                                                const lowStock =
                                                                    variant.stock_on_hand <=
                                                                        5 &&
                                                                    variant.stock_on_hand >
                                                                        0;
                                                                return (
                                                                    <button
                                                                        key={
                                                                            variant.id
                                                                        }
                                                                        type="button"
                                                                        className="d-flex align-items-start border-bottom w-100 gap-3 border-0 bg-white px-3 py-3 text-start"
                                                                        style={{
                                                                            cursor:
                                                                                outOfStock ||
                                                                                inCart
                                                                                    ? 'not-allowed'
                                                                                    : 'pointer',
                                                                            opacity:
                                                                                outOfStock ||
                                                                                inCart
                                                                                    ? 0.5
                                                                                    : 1,
                                                                            transition:
                                                                                'background-color 0.15s',
                                                                        }}
                                                                        onMouseEnter={(
                                                                            e,
                                                                        ) => {
                                                                            if (
                                                                                !inCart &&
                                                                                !outOfStock
                                                                            ) {
                                                                                e.currentTarget.style.backgroundColor =
                                                                                    '#f8f9fa';
                                                                            }
                                                                        }}
                                                                        onMouseLeave={(
                                                                            e,
                                                                        ) => {
                                                                            e.currentTarget.style.backgroundColor =
                                                                                'white';
                                                                        }}
                                                                        onMouseDown={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            if (
                                                                                !inCart &&
                                                                                !outOfStock
                                                                            )
                                                                                addVariant(
                                                                                    variant,
                                                                                );
                                                                        }}
                                                                        disabled={
                                                                            inCart ||
                                                                            outOfStock
                                                                        }
                                                                    >
                                                                        <div className="min-w-0 flex-grow-1">
                                                                            <div className="fw-semibold text-truncate mb-1">
                                                                                {variantLabel(
                                                                                    variant,
                                                                                )}
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
                                                                                <span className="small text-muted">
                                                                                    $
                                                                                    {
                                                                                        variant.sale_price_usd
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-end">
                                                                            {inCart && (
                                                                                <Badge bg="success">
                                                                                    In
                                                                                    Cart
                                                                                </Badge>
                                                                            )}
                                                                            {outOfStock && (
                                                                                <Badge bg="danger">
                                                                                    Out
                                                                                    of
                                                                                    Stock
                                                                                </Badge>
                                                                            )}
                                                                            {!inCart &&
                                                                                !outOfStock && (
                                                                                    <div>
                                                                                        <div className="small mb-1 text-muted">
                                                                                            Stock
                                                                                        </div>
                                                                                        <div
                                                                                            className={`fw-bold fs-5 ${lowStock ? 'text-warning' : 'text-success'}`}
                                                                                        >
                                                                                            {
                                                                                                variant.stock_on_hand
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                            {showPicker &&
                                                search &&
                                                filteredVariants.length ===
                                                    0 && (
                                                    <div
                                                        className="position-absolute small w-100 rounded border bg-white px-3 py-2 text-muted shadow-sm"
                                                        style={{ zIndex: 1000 }}
                                                    >
                                                        No variants found.
                                                    </div>
                                                )}
                                        </div>

                                        {/* Cart Items */}
                                        <div className="vstack gap-3">
                                            {data.items.map((item, index) => {
                                                const variant = getVariant(
                                                    item.product_variant_id,
                                                );
                                                if (!variant) return null;

                                                const qtyNum =
                                                    Number(item.qty) || 0;
                                                const overStock =
                                                    qtyNum >
                                                    variant.stock_on_hand;

                                                return (
                                                    <div
                                                        key={
                                                            item.product_variant_id
                                                        }
                                                        className="rounded-3 bg-light border p-3"
                                                        style={{
                                                            boxShadow:
                                                                '0 2px 4px rgba(0,0,0,0.05)',
                                                        }}
                                                    >
                                                        {/* Product Info Row */}
                                                        <div className="d-flex align-items-start justify-content-between mb-3">
                                                            <div className="me-2 flex-grow-1">
                                                                <div className="fw-bold fs-6 mb-1">
                                                                    {variantLabel(
                                                                        variant,
                                                                    )}
                                                                </div>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <Badge
                                                                        bg="secondary"
                                                                        className="font-monospace"
                                                                    >
                                                                        {
                                                                            variant.sku
                                                                        }
                                                                    </Badge>
                                                                    <span className="small text-muted">
                                                                        Stock:{' '}
                                                                        <span
                                                                            className={
                                                                                variant.stock_on_hand <=
                                                                                5
                                                                                    ? 'text-danger fw-bold'
                                                                                    : 'fw-semibold'
                                                                            }
                                                                        >
                                                                            {
                                                                                variant.stock_on_hand
                                                                            }
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() =>
                                                                    removeItem(
                                                                        index,
                                                                    )
                                                                }
                                                                className="ms-2"
                                                            >
                                                                <i className="ri-delete-bin-line"></i>
                                                            </Button>
                                                        </div>

                                                        {/* Quantity & Price Controls */}
                                                        <div className="row g-2">
                                                            {/* Quantity with +/- buttons */}
                                                            <div className="col-md-4 col-12">
                                                                <Form.Label className="small mb-1 text-muted">
                                                                    Quantity
                                                                </Form.Label>
                                                                <div className="input-group">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            const newQty =
                                                                                Math.max(
                                                                                    1,
                                                                                    qtyNum -
                                                                                        1,
                                                                                );
                                                                            updateItem(
                                                                                index,
                                                                                'qty',
                                                                                newQty.toString(),
                                                                            );
                                                                        }}
                                                                        disabled={
                                                                            qtyNum <=
                                                                            1
                                                                        }
                                                                    >
                                                                        <i className="ri-subtract-line"></i>
                                                                    </Button>
                                                                    <Form.Control
                                                                        type="number"
                                                                        min="1"
                                                                        max={
                                                                            variant.stock_on_hand
                                                                        }
                                                                        value={
                                                                            item.qty
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                'qty',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        isInvalid={
                                                                            overStock
                                                                        }
                                                                        className="fw-bold fs-5 text-center"
                                                                        style={{
                                                                            maxWidth: 80,
                                                                        }}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            const newQty =
                                                                                Math.min(
                                                                                    variant.stock_on_hand,
                                                                                    qtyNum +
                                                                                        1,
                                                                                );
                                                                            updateItem(
                                                                                index,
                                                                                'qty',
                                                                                newQty.toString(),
                                                                            );
                                                                        }}
                                                                        disabled={
                                                                            qtyNum >=
                                                                            variant.stock_on_hand
                                                                        }
                                                                    >
                                                                        <i className="ri-add-line"></i>
                                                                    </Button>
                                                                </div>
                                                                {overStock && (
                                                                    <div className="small text-danger mt-1">
                                                                        Exceeds
                                                                        stock
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Unit Price */}
                                                            <div className="col-md-3 col-6">
                                                                <Form.Label className="small mb-1 text-muted">
                                                                    Unit Price
                                                                </Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={
                                                                        item.unit_price_usd
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateItem(
                                                                            index,
                                                                            'unit_price_usd',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="0.00"
                                                                />
                                                            </div>

                                                            {/* Discount */}
                                                            <div className="col-md-2 col-6">
                                                                <Form.Label className="small mb-1 text-muted">
                                                                    Discount
                                                                </Form.Label>
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
                                                                        updateItem(
                                                                            index,
                                                                            'discount_usd',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="0.00"
                                                                />
                                                            </div>

                                                            {/* Item Total */}
                                                            <div className="col-md-3 col-12">
                                                                <Form.Label className="small mb-1 text-muted">
                                                                    Total
                                                                </Form.Label>
                                                                <div
                                                                    className="fw-bold text-success d-flex align-items-center"
                                                                    style={{
                                                                        fontSize:
                                                                            '1.25rem',
                                                                        height: 38,
                                                                    }}
                                                                >
                                                                    $
                                                                    {itemTotal(
                                                                        item,
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {data.items.length === 0 && (
                                                <div className="bg-light-subtle rounded border py-5 text-center text-muted">
                                                    <i className="ri-shopping-cart-line fs-1 d-block mb-2"></i>
                                                    <p className="mb-0">
                                                        Search and select
                                                        variants to add items.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xl={4}>
                                <Card className="mb-3">
                                    <Card.Body>
                                        <h4 className="card-title mb-3">
                                            Order Summary
                                        </h4>

                                        <div className="vstack mb-3 gap-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted">
                                                    Total Items
                                                </span>
                                                <span className="fw-bold fs-5">
                                                    {totalQty}
                                                </span>
                                            </div>

                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">
                                                    Subtotal
                                                </span>
                                                <span className="fw-semibold">
                                                    ${subtotal.toFixed(2)}
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
                                                    style={{ width: 100 }}
                                                />
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted">
                                                    Delivery Fee
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
                                                    style={{ width: 100 }}
                                                />
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted">
                                                    Actual Delivery Cost
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
                                                    style={{ width: 100 }}
                                                />
                                            </div>

                                            <hr className="my-1" />

                                            <div className="d-flex justify-content-between">
                                                <span className="fw-semibold">
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
                                                    style={{ width: 100 }}
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

                                            {due === 0 && paid > 0 && (
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-success">
                                                        Paid in Full
                                                    </span>
                                                    <span className="fw-bold text-success">
                                                        ${paid.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="d-grid gap-2">
                                            <Button
                                                type="submit"
                                                variant="success"
                                                disabled={
                                                    processing ||
                                                    data.items.length === 0
                                                }
                                            >
                                                {processing
                                                    ? 'Saving...'
                                                    : 'Save Sale'}
                                            </Button>
                                            <Link
                                                href={salesIndex.url()}
                                                className="btn btn-outline-secondary"
                                            >
                                                Cancel
                                            </Link>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Form>
                </Container>
            </div>
        </>
    );
}

SalesCreate.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default SalesCreate;

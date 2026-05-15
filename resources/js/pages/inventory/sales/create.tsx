import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
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
        sale_date: new Date().toISOString().split('T')[0],
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

    const submit = (e: FormEvent<HTMLFormElement>) => {
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
                                        <div className="position-relative mb-3">
                                            <Form.Control
                                                type="text"
                                                placeholder="Search by SKU, product, color, size..."
                                                value={search}
                                                onChange={(e) => {
                                                    setSearch(e.target.value);
                                                    setShowPicker(true);
                                                }}
                                                onFocus={() =>
                                                    setShowPicker(true)
                                                }
                                                autoComplete="off"
                                            />
                                            {showPicker &&
                                                filteredVariants.length > 0 && (
                                                    <div
                                                        className="position-absolute w-100 rounded border bg-white shadow-sm"
                                                        style={{
                                                            zIndex: 1000,
                                                            maxHeight: 320,
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
                                                                return (
                                                                    <button
                                                                        key={
                                                                            variant.id
                                                                        }
                                                                        type="button"
                                                                        className="d-flex align-items-center hover-bg-light w-100 gap-2 border-0 bg-white px-3 py-2 text-start"
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
                                                                            <div className="fw-medium text-truncate">
                                                                                {variantLabel(
                                                                                    variant,
                                                                                )}
                                                                            </div>
                                                                            <div className="small text-muted">
                                                                                {
                                                                                    variant.sku
                                                                                }{' '}
                                                                                &middot;
                                                                                Stock:{' '}
                                                                                <span
                                                                                    className={
                                                                                        variant.stock_on_hand <=
                                                                                        5
                                                                                            ? 'text-danger fw-semibold'
                                                                                            : ''
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        variant.stock_on_hand
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        {inCart && (
                                                                            <Badge bg="success">
                                                                                In
                                                                                Cart
                                                                            </Badge>
                                                                        )}
                                                                        {outOfStock && (
                                                                            <Badge bg="danger">
                                                                                Out
                                                                            </Badge>
                                                                        )}
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
                                        <div className="vstack gap-2">
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
                                                        className="d-flex align-items-center gap-2 rounded border p-2"
                                                    >
                                                        <div className="min-w-0 flex-grow-1">
                                                            <div className="fw-medium text-truncate">
                                                                {variantLabel(
                                                                    variant,
                                                                )}
                                                            </div>
                                                            <div className="small text-muted">
                                                                {variant.sku}{' '}
                                                                &middot; Stock:{' '}
                                                                {
                                                                    variant.stock_on_hand
                                                                }
                                                            </div>
                                                        </div>
                                                        <Form.Control
                                                            size="sm"
                                                            type="number"
                                                            min="1"
                                                            max={
                                                                variant.stock_on_hand
                                                            }
                                                            value={item.qty}
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    'qty',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            isInvalid={
                                                                overStock
                                                            }
                                                            style={{
                                                                width: 70,
                                                            }}
                                                        />
                                                        <div
                                                            style={{
                                                                width: 100,
                                                            }}
                                                        >
                                                            <Form.Control
                                                                size="sm"
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={
                                                                    item.unit_price_usd
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        index,
                                                                        'unit_price_usd',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Price"
                                                            />
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: 80,
                                                            }}
                                                        >
                                                            <Form.Control
                                                                size="sm"
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={
                                                                    item.discount_usd
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        index,
                                                                        'discount_usd',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Disc"
                                                            />
                                                        </div>
                                                        <div
                                                            className="text-end"
                                                            style={{
                                                                minWidth: 70,
                                                            }}
                                                        >
                                                            <div className="fw-semibold">
                                                                $
                                                                {itemTotal(
                                                                    item,
                                                                ).toFixed(2)}
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
                                                        >
                                                            &times;
                                                        </Button>
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

import { Head, useForm, usePage } from '@inertiajs/react';
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
import { update as salesUpdate } from '@/routes/sales';

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
        image_url: string | null;
    };
};

type SaleItem = {
    id: number;
    product_variant_id: number;
    qty: number;
    unit_price_usd: string;
    discount_usd: string;
    product_variant: {
        id: number;
        sku: string;
        color: string | null;
        size: string;
        product_name: string;
    };
};

type Sale = {
    id: number;
    invoice_no: string;
    customer_name: string | null;
    customer_phone: string | null;
    customer_address: string | null;
    source_page: string | null;
    sale_date: string;
    currency: string;
    exchange_rate: string;
    discount_usd: string;
    customer_delivery_fee_usd: string;
    actual_delivery_cost_usd: string;
    paid_usd: string;
    note: string | null;
    items: SaleItem[];
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
    customer_address: string;
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

type SalesEditProps = {
    sale: Sale;
    variants: Variant[];
    sourcePageOptions: string[];
};

function SalesEdit() {
    const { sale, variants, sourcePageOptions } =
        usePage<SalesEditProps>().props;

    const initialItems: CartItem[] = useMemo(() => {
        return sale.items.map((item) => ({
            product_variant_id: item.product_variant_id,
            qty: String(item.qty),
            unit_price_usd: item.unit_price_usd,
            discount_usd: item.discount_usd,
        }));
    }, [sale.items]);

    const { data, setData, put, processing, errors } = useForm<FormData>({
        customer_name: sale.customer_name ?? '',
        customer_phone: sale.customer_phone ?? '',
        customer_address: sale.customer_address ?? '',
        source_page: sale.source_page ?? 'Other',
        sale_date: sale.sale_date,
        currency: sale.currency,
        exchange_rate: sale.exchange_rate,
        discount_usd: sale.discount_usd,
        customer_delivery_fee_usd: sale.customer_delivery_fee_usd,
        actual_delivery_cost_usd: sale.actual_delivery_cost_usd,
        paid_usd: sale.paid_usd,
        note: sale.note ?? '',
        items: initialItems,
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
        put(salesUpdate(sale.id).url);
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
            <Head title={`Edit ${sale.invoice_no}`} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Edit Sale" pageTitle="Sales" />

                    <Form onSubmit={submit}>
                        <Row>
                            <Col xl={8}>
                                <Card className="mb-3">
                                    <Card.Body>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h4 className="card-title mb-0">
                                                {sale.invoice_no}
                                            </h4>
                                            <Badge bg="info">Editing</Badge>
                                        </div>
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
                                                    />
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
                                                    />
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
                                                    >
                                                        {sourcePageOptions.map(
                                                            (opt) => (
                                                                <option
                                                                    key={opt}
                                                                    value={opt}
                                                                >
                                                                    {opt}
                                                                </option>
                                                            ),
                                                        )}
                                                    </Form.Select>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Customer Address
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        value={
                                                            data.customer_address
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'customer_address',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
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
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.sale_date}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Exchange Rate
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.0001"
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
                                        </Row>
                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Discount (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={
                                                            data.discount_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'discount_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Delivery Fee (USD)
                                                    </Form.Label>
                                                    <Form.Control
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
                                                    />
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Actual Delivery Cost
                                                        (USD)
                                                    </Form.Label>
                                                    <Form.Control
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
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label>
                                                        Amount Paid (USD)
                                                    </Form.Label>
                                                    <Form.Control
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
                                                        rows={2}
                                                        value={data.note}
                                                        onChange={(e) =>
                                                            setData(
                                                                'note',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
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
                                                {data.items.length} items ·{' '}
                                                {totalQty} units
                                            </span>
                                        </div>

                                        {(() => {
                                            const itemsError = (
                                                errors as Record<
                                                    string,
                                                    unknown
                                                >
                                            ).items;
                                            if (!itemsError) return null;
                                            return (
                                                <Alert
                                                    variant="danger"
                                                    className="mb-3"
                                                >
                                                    {typeof itemsError ===
                                                    'string'
                                                        ? itemsError
                                                        : 'Please check your items.'}
                                                </Alert>
                                            );
                                        })()}

                                        {/* Variant Picker */}
                                        <div className="position-relative mb-3">
                                            <Form.Control
                                                type="text"
                                                placeholder="Search variants by SKU, product, color, size..."
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
                                                            maxHeight: 300,
                                                            overflowY: 'auto',
                                                        }}
                                                    >
                                                        {filteredVariants.map(
                                                            (v) => {
                                                                const isSelected =
                                                                    selectedVariantIds.has(
                                                                        v.id,
                                                                    );
                                                                return (
                                                                    <button
                                                                        key={
                                                                            v.id
                                                                        }
                                                                        type="button"
                                                                        className="d-flex align-items-center w-100 gap-2 border-0 bg-white px-3 py-2 text-start"
                                                                        style={{
                                                                            cursor: isSelected
                                                                                ? 'not-allowed'
                                                                                : 'pointer',
                                                                            opacity:
                                                                                isSelected
                                                                                    ? 0.5
                                                                                    : 1,
                                                                        }}
                                                                        disabled={
                                                                            isSelected
                                                                        }
                                                                        onMouseDown={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            if (
                                                                                !isSelected
                                                                            ) {
                                                                                addVariant(
                                                                                    v,
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className="bg-light flex-shrink-0 overflow-hidden rounded border"
                                                                            style={{
                                                                                width: 48,
                                                                                height: 48,
                                                                            }}
                                                                        >
                                                                            {v
                                                                                .product
                                                                                .image_url ? (
                                                                                <img
                                                                                    src={
                                                                                        v
                                                                                            .product
                                                                                            .image_url
                                                                                    }
                                                                                    alt={
                                                                                        v
                                                                                            .product
                                                                                            .name
                                                                                    }
                                                                                    className="object-fit-cover h-100 w-100"
                                                                                />
                                                                            ) : (
                                                                                <div className="d-flex align-items-center justify-content-center h-100 w-100 text-muted">
                                                                                    <i className="ri-image-line"></i>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-grow-1">
                                                                            <div className="fw-medium">
                                                                                {
                                                                                    v.sku
                                                                                }
                                                                            </div>
                                                                            <div className="small text-muted">
                                                                                {variantLabel(
                                                                                    v,
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <Badge
                                                                            bg={
                                                                                v.stock_on_hand >
                                                                                0
                                                                                    ? 'success'
                                                                                    : 'secondary'
                                                                            }
                                                                        >
                                                                            {
                                                                                v.stock_on_hand
                                                                            }{' '}
                                                                            in
                                                                            stock
                                                                        </Badge>
                                                                    </button>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                        </div>

                                        {/* Items List */}
                                        <div className="vstack gap-2">
                                            {data.items.map((item, index) => {
                                                const variant = getVariant(
                                                    item.product_variant_id,
                                                );
                                                if (!variant) return null;

                                                return (
                                                    <Card
                                                        key={index}
                                                        className="border"
                                                    >
                                                        <Card.Body>
                                                            <div className="d-flex align-items-start mb-2 gap-3">
                                                                <div className="flex-grow-1">
                                                                    <div className="fw-medium">
                                                                        {
                                                                            variant
                                                                                .product
                                                                                .name
                                                                        }
                                                                    </div>
                                                                    <div className="small text-muted">
                                                                        {
                                                                            variant.sku
                                                                        }{' '}
                                                                        ·{' '}
                                                                        {[
                                                                            variant.color,
                                                                            variant.size,
                                                                        ]
                                                                            .filter(
                                                                                Boolean,
                                                                            )
                                                                            .join(
                                                                                ' / ',
                                                                            )}
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
                                                                    <i className="ri-delete-bin-line"></i>
                                                                </Button>
                                                            </div>
                                                            <Row className="g-2">
                                                                <Col xs={3}>
                                                                    <Form.Label className="small">
                                                                        Qty
                                                                    </Form.Label>
                                                                    <Form.Control
                                                                        type="number"
                                                                        min="1"
                                                                        size="sm"
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
                                                                    />
                                                                </Col>
                                                                <Col xs={3}>
                                                                    <Form.Label className="small">
                                                                        Unit
                                                                        Price
                                                                    </Form.Label>
                                                                    <Form.Control
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        size="sm"
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
                                                                    />
                                                                </Col>
                                                                <Col xs={3}>
                                                                    <Form.Label className="small">
                                                                        Discount
                                                                    </Form.Label>
                                                                    <Form.Control
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        size="sm"
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
                                                                    />
                                                                </Col>
                                                                <Col xs={3}>
                                                                    <Form.Label className="small">
                                                                        Total
                                                                    </Form.Label>
                                                                    <div className="fw-semibold pt-2">
                                                                        $
                                                                        {itemTotal(
                                                                            item,
                                                                        ).toFixed(
                                                                            2,
                                                                        )}
                                                                    </div>
                                                                </Col>
                                                            </Row>
                                                        </Card.Body>
                                                    </Card>
                                                );
                                            })}

                                            {data.items.length === 0 && (
                                                <div className="bg-light-subtle rounded border py-5 text-center text-muted">
                                                    <i className="ri-shopping-cart-line fs-1 d-block mb-2"></i>
                                                    <p className="mb-0">
                                                        No items added.
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
                                            Summary
                                        </h4>
                                        <div className="vstack gap-2">
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">
                                                    Items ({totalQty} units)
                                                </span>
                                                <span className="fw-semibold">
                                                    ${subtotal.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">
                                                    Discount
                                                </span>
                                                <span className="fw-semibold">
                                                    -${discount.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">
                                                    Delivery Fee
                                                </span>
                                                <span className="fw-semibold">
                                                    ${deliveryFee.toFixed(2)}
                                                </span>
                                            </div>
                                            <hr className="my-1" />
                                            <div className="d-flex justify-content-between">
                                                <span className="fw-semibold">
                                                    Total
                                                </span>
                                                <span className="fw-bold">
                                                    ${total.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">
                                                    Paid
                                                </span>
                                                <span className="fw-semibold text-success">
                                                    ${paid.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">
                                                    Due
                                                </span>
                                                <span className="fw-semibold text-danger">
                                                    ${due.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <hr />

                                        <Alert
                                            variant="warning"
                                            className="small"
                                        >
                                            <i className="ri-information-line me-1"></i>
                                            Editing will recalculate stock. Old
                                            items will be restored, new items
                                            will be deducted.
                                        </Alert>

                                        <div className="d-grid gap-2">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Saving...'
                                                    : 'Save Changes'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline-secondary"
                                                onClick={() =>
                                                    window.history.back()
                                                }
                                            >
                                                Cancel
                                            </Button>
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

SalesEdit.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default SalesEdit;

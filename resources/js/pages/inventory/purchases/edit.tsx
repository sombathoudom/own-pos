import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
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
import {
    update as purchasesUpdate,
    show as purchasesShow,
} from '@/routes/purchases';

type Supplier = { id: number; name: string };
type Category = { id: number; name: string };
type Variant = {
    id: number;
    product_id: number;
    sku: string;
    color: string | null;
    size: string;
    sale_price_usd: string;
};
type Product = {
    id: number;
    name: string;
    category_id: number;
    image_url: string | null;
    variants: Variant[];
};

type ProductRow = {
    product_id: string;
    unit_cost_usd: string;
    sale_price_usd: string;
    variantQtys: Record<string, string>;
};

type PurchaseItem = {
    category_id: number;
    product_id: number;
    product_variant_id: number;
    qty: string;
    unit_cost_usd: string;
    sale_price_usd: string;
};

type Purchase = {
    id: number;
    purchase_no: string;
    purchase_date: string;
    arrival_date: string | null;
    currency: string;
    exchange_rate: string;
    purchase_delivery_cost_usd: string;
    other_cost_usd: string;
    status: string;
    note: string | null;
    supplier_id: number | null;
    items: PurchaseItem[];
};

type FormData = {
    supplier_id: string;
    purchase_date: string;
    arrival_date: string;
    exchange_rate: string;
    purchase_delivery_cost_usd: string;
    other_cost_usd: string;
    note: string;
    productRows: ProductRow[];
};

type PurchasesEditProps = {
    purchase: Purchase;
    suppliers: Supplier[];
    categories: Category[];
    products: Product[];
};

function PurchasesEdit() {
    const { purchase, suppliers, categories, products } =
        usePage<PurchasesEditProps>().props;

    const initialProductRows = useMemo(() => {
        const grouped: Record<string, ProductRow> = {};

        for (const item of purchase.items) {
            const productId = String(item.product_id);
            if (!grouped[productId]) {
                grouped[productId] = {
                    product_id: productId,
                    unit_cost_usd: item.unit_cost_usd,
                    sale_price_usd: item.sale_price_usd,
                    variantQtys: {},
                };
            }
            grouped[productId].variantQtys[String(item.product_variant_id)] =
                item.qty;
        }

        return Object.values(grouped);
    }, [purchase.items]);

    const { data, setData, put, processing, errors, transform } =
        useForm<FormData>({
            supplier_id: String(purchase.supplier_id ?? ''),
            purchase_date: purchase.purchase_date,
            arrival_date: purchase.arrival_date ?? '',
            exchange_rate: String(purchase.exchange_rate),
            purchase_delivery_cost_usd: String(
                purchase.purchase_delivery_cost_usd,
            ),
            other_cost_usd: String(purchase.other_cost_usd),
            note: purchase.note ?? '',
            productRows: initialProductRows,
        });

    const [productSearch, setProductSearch] = useState('');
    const [showPicker, setShowPicker] = useState(false);

    transform((formData) => {
        const items: Array<{
            category_id: string;
            product_id: string;
            product_variant_id: string;
            qty: string;
            unit_cost_usd: string;
            sale_price_usd: string;
        }> = [];

        for (const row of formData.productRows) {
            for (const [variantId, qty] of Object.entries(row.variantQtys)) {
                const qtyNum = Number(qty);
                if (qtyNum > 0) {
                    const product = products.find(
                        (p) => String(p.id) === row.product_id,
                    );
                    items.push({
                        category_id: String(product?.category_id ?? ''),
                        product_id: row.product_id,
                        product_variant_id: variantId,
                        qty: String(qtyNum),
                        unit_cost_usd: row.unit_cost_usd,
                        sale_price_usd: row.sale_price_usd,
                    });
                }
            }
        }

        return {
            supplier_id: formData.supplier_id || null,
            purchase_date: formData.purchase_date,
            arrival_date: formData.arrival_date || null,
            exchange_rate: formData.exchange_rate,
            purchase_delivery_cost_usd: formData.purchase_delivery_cost_usd,
            other_cost_usd: formData.other_cost_usd,
            note: formData.note,
            items,
        };
    });

    const selectedProductIds = useMemo(
        () =>
            new Set(data.productRows.map((r) => r.product_id).filter(Boolean)),
        [data.productRows],
    );

    const filteredProducts = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        return products.filter((p) => {
            if (selectedProductIds.has(String(p.id))) return false;
            if (!term) return true;
            return p.name.toLowerCase().includes(term);
        });
    }, [products, selectedProductIds, productSearch]);

    const addProduct = (product: Product) => {
        const defaultSalePrice = product.variants[0]?.sale_price_usd ?? '0';
        const variantQtys: Record<string, string> = {};
        for (const v of product.variants) {
            variantQtys[String(v.id)] = '0';
        }

        setData('productRows', [
            ...data.productRows,
            {
                product_id: String(product.id),
                unit_cost_usd: '0',
                sale_price_usd: defaultSalePrice,
                variantQtys,
            },
        ]);
        setProductSearch('');
        setShowPicker(false);
    };

    const removeRow = (index: number) => {
        setData(
            'productRows',
            data.productRows.filter((_, i) => i !== index),
        );
    };

    const updateRow = (
        index: number,
        field: keyof Omit<ProductRow, 'variantQtys'>,
        value: string,
    ) => {
        const rows = [...data.productRows];
        rows[index] = { ...rows[index], [field]: value };
        setData('productRows', rows);
    };

    const updateVariantQty = (
        rowIndex: number,
        variantId: string,
        value: string,
    ) => {
        const rows = [...data.productRows];
        rows[rowIndex] = {
            ...rows[rowIndex],
            variantQtys: {
                ...rows[rowIndex].variantQtys,
                [variantId]: value,
            },
        };
        setData('productRows', rows);
    };

    const getProduct = (productId: string): Product | undefined => {
        return products.find((p) => String(p.id) === productId);
    };

    const getCategoryName = (categoryId: number): string => {
        return categories.find((c) => c.id === categoryId)?.name ?? '-';
    };

    const rowTotalQty = (row: ProductRow): number => {
        return Object.values(row.variantQtys).reduce(
            (sum, q) => sum + (Number(q) || 0),
            0,
        );
    };

    const rowSubtotal = (row: ProductRow): number => {
        return rowTotalQty(row) * (Number(row.unit_cost_usd) || 0);
    };

    const totalQtyAll = data.productRows.reduce(
        (sum, row) => sum + rowTotalQty(row),
        0,
    );

    const subtotal = data.productRows.reduce(
        (sum, row) => sum + rowSubtotal(row),
        0,
    );

    const deliveryCost = Number(data.purchase_delivery_cost_usd) || 0;
    const otherCost = Number(data.other_cost_usd) || 0;
    const totalCost = subtotal + deliveryCost + otherCost;

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(purchasesUpdate(purchase.id).url);
    };

    const variantLabel = (variant: Variant): string => {
        if (variant.color && variant.size) {
            return `${variant.color} / ${variant.size}`;
        }
        return variant.size || variant.color || variant.sku;
    };

    return (
        <>
            <Head title={`Edit ${purchase.purchase_no}`} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Edit Purchase" pageTitle="Purchases" />

                    <Form onSubmit={submit}>
                        <Row>
                            <Col xl={8}>
                                <Card className="mb-3">
                                    <Card.Body>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h4 className="card-title mb-0">
                                                {purchase.purchase_no}
                                            </h4>
                                            <Badge bg="warning">
                                                In Transit
                                            </Badge>
                                        </div>
                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="supplier_id">
                                                        Supplier
                                                    </Form.Label>
                                                    <Form.Select
                                                        id="supplier_id"
                                                        value={data.supplier_id}
                                                        onChange={(e) =>
                                                            setData(
                                                                'supplier_id',
                                                                e.target.value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.supplier_id
                                                        }
                                                    >
                                                        <option value="">
                                                            Select supplier
                                                        </option>
                                                        {suppliers.map(
                                                            (s: Supplier) => (
                                                                <option
                                                                    key={s.id}
                                                                    value={s.id}
                                                                >
                                                                    {s.name}
                                                                </option>
                                                            ),
                                                        )}
                                                    </Form.Select>
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.supplier_id}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="purchase_date">
                                                        Purchase Date
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="purchase_date"
                                                        type="date"
                                                        value={
                                                            data.purchase_date
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'purchase_date',
                                                                e.target.value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.purchase_date
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.purchase_date}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="arrival_date">
                                                        Arrival Date
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="arrival_date"
                                                        type="date"
                                                        value={
                                                            data.arrival_date
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'arrival_date',
                                                                e.target.value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.arrival_date
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.arrival_date}
                                                    </Form.Control.Feedback>
                                                    <Form.Text className="text-muted">
                                                        Set to mark as arrived
                                                    </Form.Text>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="exchange_rate">
                                                        Exchange Rate
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="exchange_rate"
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
                                                        isInvalid={
                                                            !!errors.exchange_rate
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.exchange_rate}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="purchase_delivery_cost_usd">
                                                        Delivery Cost (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="purchase_delivery_cost_usd"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={
                                                            data.purchase_delivery_cost_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'purchase_delivery_cost_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.purchase_delivery_cost_usd
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {
                                                            errors.purchase_delivery_cost_usd
                                                        }
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="other_cost_usd">
                                                        Other Cost (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="other_cost_usd"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={
                                                            data.other_cost_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'other_cost_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.other_cost_usd
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.other_cost_usd}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                        </Row>
                                        <div className="mb-3">
                                            <Form.Label htmlFor="note">
                                                Note
                                            </Form.Label>
                                            <Form.Control
                                                id="note"
                                                as="textarea"
                                                rows={2}
                                                value={data.note}
                                                onChange={(e) =>
                                                    setData(
                                                        'note',
                                                        e.target.value,
                                                    )
                                                }
                                                isInvalid={!!errors.note}
                                            />
                                            <Form.Control.Feedback
                                                type="invalid"
                                                className="d-block"
                                            >
                                                {errors.note}
                                            </Form.Control.Feedback>
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="mb-3">
                                    <Card.Body>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h4 className="card-title mb-0">
                                                Purchase Items
                                            </h4>
                                            <span className="small text-muted">
                                                {data.productRows.length}{' '}
                                                product
                                                {data.productRows.length !== 1
                                                    ? 's'
                                                    : ''}
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

                                        {/* Product Picker */}
                                        <div className="position-relative mb-3">
                                            <Form.Control
                                                type="text"
                                                placeholder="Search products..."
                                                value={productSearch}
                                                onChange={(e) => {
                                                    setProductSearch(
                                                        e.target.value,
                                                    );
                                                    setShowPicker(true);
                                                }}
                                                onFocus={() =>
                                                    setShowPicker(true)
                                                }
                                                autoComplete="off"
                                            />
                                            {showPicker &&
                                                filteredProducts.length > 0 && (
                                                    <div
                                                        className="position-absolute w-100 rounded border bg-white shadow-sm"
                                                        style={{
                                                            zIndex: 1000,
                                                            maxHeight: 320,
                                                            overflowY: 'auto',
                                                        }}
                                                    >
                                                        {filteredProducts.map(
                                                            (product) => (
                                                                <button
                                                                    key={
                                                                        product.id
                                                                    }
                                                                    type="button"
                                                                    className="d-flex align-items-center hover-bg-light w-100 gap-2 border-0 bg-white px-3 py-2 text-start"
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                    }}
                                                                    onMouseDown={(
                                                                        e,
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        addProduct(
                                                                            product,
                                                                        );
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="bg-light flex-shrink-0 rounded border"
                                                                        style={{
                                                                            width: 40,
                                                                            height: 40,
                                                                        }}
                                                                    >
                                                                        {product.image_url ? (
                                                                            <img
                                                                                src={
                                                                                    product.image_url
                                                                                }
                                                                                alt={
                                                                                    product.name
                                                                                }
                                                                                className="object-fit-cover h-100 w-100 rounded"
                                                                            />
                                                                        ) : (
                                                                            <div className="d-flex align-items-center justify-content-center h-100 w-100 text-muted">
                                                                                <i className="ri-image-line"></i>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-grow-1">
                                                                        <div className="fw-medium text-truncate">
                                                                            {
                                                                                product.name
                                                                            }
                                                                        </div>
                                                                        <div className="small text-muted">
                                                                            {getCategoryName(
                                                                                product.category_id,
                                                                            )}{' '}
                                                                            ·{' '}
                                                                            {
                                                                                product
                                                                                    .variants
                                                                                    .length
                                                                            }{' '}
                                                                            variant
                                                                            {product
                                                                                .variants
                                                                                .length !==
                                                                            1
                                                                                ? 's'
                                                                                : ''}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            {showPicker &&
                                                productSearch &&
                                                filteredProducts.length ===
                                                    0 && (
                                                    <div
                                                        className="position-absolute small w-100 rounded border bg-white px-3 py-2 text-muted shadow-sm"
                                                        style={{ zIndex: 1000 }}
                                                    >
                                                        No products found.
                                                    </div>
                                                )}
                                        </div>

                                        {/* Product Rows */}
                                        <div className="vstack gap-3">
                                            {data.productRows.map(
                                                (row, index) => {
                                                    const product = getProduct(
                                                        row.product_id,
                                                    );

                                                    if (!product) {
                                                        return null;
                                                    }

                                                    return (
                                                        <Card
                                                            key={index}
                                                            className="border"
                                                        >
                                                            <Card.Body>
                                                                <div className="d-flex align-items-start mb-2 gap-3">
                                                                    <div
                                                                        className="bg-light flex-shrink-0 rounded border"
                                                                        style={{
                                                                            width: 48,
                                                                            height: 48,
                                                                        }}
                                                                    >
                                                                        {product.image_url ? (
                                                                            <img
                                                                                src={
                                                                                    product.image_url
                                                                                }
                                                                                alt={
                                                                                    product.name
                                                                                }
                                                                                className="object-fit-cover h-100 w-100 rounded"
                                                                            />
                                                                        ) : (
                                                                            <div className="d-flex align-items-center justify-content-center h-100 w-100 text-muted">
                                                                                <i className="ri-image-line"></i>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-grow-1">
                                                                        <div className="fw-medium">
                                                                            {
                                                                                product.name
                                                                            }
                                                                        </div>
                                                                        <div className="small text-muted">
                                                                            {getCategoryName(
                                                                                product.category_id,
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            removeRow(
                                                                                index,
                                                                            )
                                                                        }
                                                                    >
                                                                        <i className="ri-delete-bin-line"></i>
                                                                    </Button>
                                                                </div>

                                                                <Row className="g-2 mb-2">
                                                                    <Col xs={6}>
                                                                        <Form.Label className="small">
                                                                            Unit
                                                                            Cost
                                                                            (USD)
                                                                        </Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0"
                                                                            size="sm"
                                                                            value={
                                                                                row.unit_cost_usd
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateRow(
                                                                                    index,
                                                                                    'unit_cost_usd',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </Col>
                                                                    <Col xs={6}>
                                                                        <Form.Label className="small">
                                                                            Sale
                                                                            Price
                                                                            (USD)
                                                                        </Form.Label>
                                                                        <Form.Control
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0"
                                                                            size="sm"
                                                                            value={
                                                                                row.sale_price_usd
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateRow(
                                                                                    index,
                                                                                    'sale_price_usd',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </Col>
                                                                </Row>

                                                                <div className="small mb-2 text-muted">
                                                                    Quantities
                                                                    by variant:
                                                                </div>
                                                                <Row className="g-2">
                                                                    {product.variants.map(
                                                                        (v) => (
                                                                            <Col
                                                                                xs={
                                                                                    6
                                                                                }
                                                                                sm={
                                                                                    4
                                                                                }
                                                                                md={
                                                                                    3
                                                                                }
                                                                                key={
                                                                                    v.id
                                                                                }
                                                                            >
                                                                                <Form.Label className="small text-truncate d-block">
                                                                                    {variantLabel(
                                                                                        v,
                                                                                    )}
                                                                                </Form.Label>
                                                                                <Form.Control
                                                                                    type="number"
                                                                                    min="0"
                                                                                    size="sm"
                                                                                    value={
                                                                                        row
                                                                                            .variantQtys[
                                                                                            String(
                                                                                                v.id,
                                                                                            )
                                                                                        ] ??
                                                                                        '0'
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateVariantQty(
                                                                                            index,
                                                                                            String(
                                                                                                v.id,
                                                                                            ),
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </Col>
                                                                        ),
                                                                    )}
                                                                </Row>

                                                                <div className="d-flex justify-content-between border-top small mt-2 pt-2 text-muted">
                                                                    <span>
                                                                        Total:{' '}
                                                                        {rowTotalQty(
                                                                            row,
                                                                        )}{' '}
                                                                        units
                                                                    </span>
                                                                    <span>
                                                                        Subtotal:
                                                                        $
                                                                        {rowSubtotal(
                                                                            row,
                                                                        ).toFixed(
                                                                            2,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    );
                                                },
                                            )}

                                            {data.productRows.length === 0 && (
                                                <div className="bg-light-subtle rounded border py-5 text-center text-muted">
                                                    <i className="ri-shopping-cart-line fs-1 d-block mb-2"></i>
                                                    <p className="mb-0">
                                                        No products added yet.
                                                    </p>
                                                    <p className="small">
                                                        Search for products
                                                        above to add items.
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
                                                    Total Items
                                                </span>
                                                <span className="fw-semibold">
                                                    {totalQtyAll}
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
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">
                                                    Delivery Cost
                                                </span>
                                                <span className="fw-semibold">
                                                    ${deliveryCost.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">
                                                    Other Cost
                                                </span>
                                                <span className="fw-semibold">
                                                    ${otherCost.toFixed(2)}
                                                </span>
                                            </div>
                                            <hr className="my-1" />
                                            <div className="d-flex justify-content-between">
                                                <span className="fw-semibold">
                                                    Total Cost
                                                </span>
                                                <span className="fw-bold">
                                                    ${totalCost.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <hr />

                                        {data.arrival_date && (
                                            <Alert
                                                variant="info"
                                                className="small"
                                            >
                                                <i className="ri-information-line me-1"></i>
                                                Setting arrival date will mark
                                                this purchase as arrived and
                                                update stock.
                                            </Alert>
                                        )}

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

PurchasesEdit.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default PurchasesEdit;

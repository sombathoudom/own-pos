import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent, type ReactNode, useMemo, useState } from 'react';
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
    store as purchasesStore,
    index as purchasesIndex,
} from '@/routes/purchases';
import { getCurrentDate } from '@/utils/dateTime';

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

type FormData = {
    supplier_id: string;
    purchase_date: string;
    arrival_date: string;
    purchase_no: string;
    exchange_rate: string;
    purchase_delivery_cost_usd: string;
    other_cost_usd: string;
    note: string;
    productRows: ProductRow[];
};

type PurchasesCreateProps = {
    suppliers: Supplier[];
    categories: Category[];
    products: Product[];
    purchaseNo: string;
};

const emptyProductRow = (): ProductRow => ({
    product_id: '',
    unit_cost_usd: '0',
    sale_price_usd: '0',
    variantQtys: {},
});

function PurchasesCreate() {
    const { suppliers, categories, products, purchaseNo } =
        usePage<PurchasesCreateProps>().props;

    const { data, setData, post, processing, errors, transform } =
        useForm<FormData>({
            supplier_id: '',
            purchase_date: getCurrentDate(),
            arrival_date: '',
            purchase_no: purchaseNo,
            exchange_rate: '1',
            purchase_delivery_cost_usd: '0',
            other_cost_usd: '0',
            note: '',
            productRows: [],
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
            ...formData,
            items,
        } as FormData & { items: typeof items };
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

    const cloneRow = (index: number) => {
        const source = data.productRows[index];
        const cloned: ProductRow = {
            product_id: '',
            unit_cost_usd: source.unit_cost_usd,
            sale_price_usd: source.sale_price_usd,
            variantQtys: {},
        };
        setData('productRows', [
            ...data.productRows.slice(0, index + 1),
            cloned,
            ...data.productRows.slice(index + 1),
        ]);
    };

    const cloneSize = (sourceRowIndex: number, sourceSize: string) => {
        const sourceRow = data.productRows[sourceRowIndex];
        const sourceProduct = getProduct(sourceRow.product_id);
        if (!sourceProduct) return;

        // Find the variant with the source size
        const sourceVariant = sourceProduct.variants.find(
            (v) => v.size === sourceSize,
        );
        if (!sourceVariant) return;

        const sourceQty =
            sourceRow.variantQtys[String(sourceVariant.id)] || '0';
        if (sourceQty === '0') return;

        // Update all other rows with the same size
        const updatedRows = data.productRows.map((row, rowIndex) => {
            if (rowIndex === sourceRowIndex) return row;

            const product = getProduct(row.product_id);
            if (!product) return row;

            // Find variant with matching size
            const matchingVariant = product.variants.find(
                (v) => v.size === sourceSize,
            );
            if (!matchingVariant) return row;

            // Clone the quantity
            return {
                ...row,
                variantQtys: {
                    ...row.variantQtys,
                    [String(matchingVariant.id)]: sourceQty,
                },
            };
        });

        setData('productRows', updatedRows);
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

    const getDeliveryPerUnit = (row: ProductRow): number => {
        const qty = rowTotalQty(row);
        if (!qty || !totalQtyAll) return 0;
        return (deliveryCost * qty) / totalQtyAll / qty;
    };

    const getLandedUnitCost = (row: ProductRow): number => {
        const unitCost = Number(row.unit_cost_usd) || 0;
        return unitCost + getDeliveryPerUnit(row);
    };

    const categoryBreakdown = useMemo(() => {
        const map: Record<string, number> = {};
        for (const row of data.productRows) {
            const product = getProduct(row.product_id);
            if (!product) continue;
            const catName = getCategoryName(product.category_id);
            map[catName] = (map[catName] || 0) + rowTotalQty(row);
        }
        return map;
    }, [data.productRows]);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(purchasesStore.url());
    };

    const variantLabel = (variant: Variant): string => {
        if (variant.color && variant.size) {
            return `${variant.color} / ${variant.size}`;
        }
        return variant.size || variant.color || variant.sku;
    };

    return (
        <>
            <Head title="New Purchase" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="New Purchase" pageTitle="Purchases" />

                    <Form onSubmit={submit}>
                        <Row>
                            <Col xl={8}>
                                <Card className="mb-3">
                                    <Card.Body>
                                        <h4 className="card-title mb-3">
                                            Purchase Details
                                        </h4>
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
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="purchase_no">
                                                        Purchase #
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="purchase_no"
                                                        value={data.purchase_no}
                                                        onChange={(e) =>
                                                            setData(
                                                                'purchase_no',
                                                                e.target.value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.purchase_no
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.purchase_no}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
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
                                        </Row>
                                        <Row>
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
                                                                            &middot;{' '}
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
                                                        return (
                                                            <Card
                                                                key={index}
                                                                className="border-dashed"
                                                            >
                                                                <Card.Body>
                                                                    <div className="d-flex align-items-center gap-3">
                                                                        <div className="flex-grow-1">
                                                                            <Form.Select
                                                                                size="sm"
                                                                                value={
                                                                                    row.product_id
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    const pid =
                                                                                        e
                                                                                            .target
                                                                                            .value;
                                                                                    const prod =
                                                                                        products.find(
                                                                                            (
                                                                                                p,
                                                                                            ) =>
                                                                                                String(
                                                                                                    p.id,
                                                                                                ) ===
                                                                                                pid,
                                                                                        );
                                                                                    if (
                                                                                        !prod
                                                                                    )
                                                                                        return;
                                                                                    const variantQtys: Record<
                                                                                        string,
                                                                                        string
                                                                                    > =
                                                                                        {};
                                                                                    for (const v of prod.variants) {
                                                                                        variantQtys[
                                                                                            String(
                                                                                                v.id,
                                                                                            )
                                                                                        ] =
                                                                                            '0';
                                                                                    }
                                                                                    const rows =
                                                                                        [
                                                                                            ...data.productRows,
                                                                                        ];
                                                                                    rows[
                                                                                        index
                                                                                    ] =
                                                                                        {
                                                                                            ...rows[
                                                                                                index
                                                                                            ],
                                                                                            product_id:
                                                                                                pid,
                                                                                            sale_price_usd:
                                                                                                prod
                                                                                                    .variants[0]
                                                                                                    ?.sale_price_usd ??
                                                                                                '0',
                                                                                            variantQtys,
                                                                                        };
                                                                                    setData(
                                                                                        'productRows',
                                                                                        rows,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <option value="">
                                                                                    Select
                                                                                    product
                                                                                </option>
                                                                                {products
                                                                                    .filter(
                                                                                        (
                                                                                            p,
                                                                                        ) =>
                                                                                            !selectedProductIds.has(
                                                                                                String(
                                                                                                    p.id,
                                                                                                ),
                                                                                            ) ||
                                                                                            String(
                                                                                                p.id,
                                                                                            ) ===
                                                                                                row.product_id,
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            p,
                                                                                        ) => (
                                                                                            <option
                                                                                                key={
                                                                                                    p.id
                                                                                                }
                                                                                                value={
                                                                                                    p.id
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    p.name
                                                                                                }
                                                                                            </option>
                                                                                        ),
                                                                                    )}
                                                                            </Form.Select>
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
                                                                            Remove
                                                                        </Button>
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        );
                                                    }

                                                    const rowQty =
                                                        rowTotalQty(row);

                                                    return (
                                                        <Card
                                                            key={index}
                                                            className="border"
                                                        >
                                                            <Card.Body>
                                                                <div className="d-flex align-items-start gap-3">
                                                                    {/* Product Image */}
                                                                    <div
                                                                        className="bg-light flex-shrink-0 rounded border"
                                                                        style={{
                                                                            width: 64,
                                                                            height: 64,
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
                                                                                <i className="ri-image-line fs-4"></i>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="min-w-0 flex-grow-1">
                                                                        <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                                                            <div>
                                                                                <h6 className="mb-0">
                                                                                    {
                                                                                        product.name
                                                                                    }
                                                                                </h6>
                                                                                <Badge
                                                                                    bg="light"
                                                                                    className="text-dark fw-normal"
                                                                                >
                                                                                    {getCategoryName(
                                                                                        product.category_id,
                                                                                    )}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="d-flex gap-2">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline-primary"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        cloneRow(
                                                                                            index,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    Clone
                                                                                </Button>
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
                                                                                    Remove
                                                                                </Button>
                                                                            </div>
                                                                        </div>

                                                                        <div className="d-flex mb-3 flex-wrap gap-3">
                                                                            <div
                                                                                style={{
                                                                                    minWidth: 100,
                                                                                }}
                                                                            >
                                                                                <div className="small mb-1 text-muted">
                                                                                    Unit
                                                                                    Cost
                                                                                </div>
                                                                                <Form.Control
                                                                                    size="sm"
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    min="0"
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
                                                                            </div>
                                                                            <div
                                                                                style={{
                                                                                    minWidth: 90,
                                                                                }}
                                                                            >
                                                                                <div className="small mb-1 text-muted">
                                                                                    Delivery
                                                                                    /
                                                                                    Unit
                                                                                </div>
                                                                                <div className="form-control form-control-sm bg-light text-muted">
                                                                                    $
                                                                                    {getDeliveryPerUnit(
                                                                                        row,
                                                                                    ).toFixed(
                                                                                        2,
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div
                                                                                style={{
                                                                                    minWidth: 90,
                                                                                }}
                                                                            >
                                                                                <div className="small mb-1 text-muted">
                                                                                    Landed
                                                                                    Cost
                                                                                </div>
                                                                                <div className="form-control form-control-sm bg-light fw-semibold text-dark">
                                                                                    $
                                                                                    {getLandedUnitCost(
                                                                                        row,
                                                                                    ).toFixed(
                                                                                        2,
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div
                                                                                style={{
                                                                                    minWidth: 100,
                                                                                }}
                                                                            >
                                                                                <div className="small mb-1 text-muted">
                                                                                    Sale
                                                                                    Price
                                                                                </div>
                                                                                <Form.Control
                                                                                    size="sm"
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    min="0"
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
                                                                            </div>
                                                                            <div className="d-flex align-items-end">
                                                                                <div className="small text-muted">
                                                                                    Qty:{' '}
                                                                                    <span className="fw-semibold text-dark">
                                                                                        {
                                                                                            rowQty
                                                                                        }
                                                                                    </span>{' '}
                                                                                    &middot;
                                                                                    Sub:{' '}
                                                                                    <span className="fw-semibold text-dark">
                                                                                        $
                                                                                        {rowSubtotal(
                                                                                            row,
                                                                                        ).toFixed(
                                                                                            2,
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="d-flex flex-wrap gap-2">
                                                                            {product.variants.map(
                                                                                (
                                                                                    variant,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            variant.id
                                                                                        }
                                                                                        className="d-flex align-items-center bg-light-subtle gap-1 rounded border px-2 py-1"
                                                                                    >
                                                                                        <span className="small fw-medium text-nowrap">
                                                                                            {variantLabel(
                                                                                                variant,
                                                                                            )}
                                                                                        </span>
                                                                                        <Form.Control
                                                                                            size="sm"
                                                                                            type="number"
                                                                                            min="0"
                                                                                            value={
                                                                                                row
                                                                                                    .variantQtys[
                                                                                                    String(
                                                                                                        variant.id,
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
                                                                                                        variant.id,
                                                                                                    ),
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                )
                                                                                            }
                                                                                            style={{
                                                                                                width: 56,
                                                                                                border: 'none',
                                                                                                background:
                                                                                                    'transparent',
                                                                                                padding:
                                                                                                    '0.15rem 0.3rem',
                                                                                            }}
                                                                                        />
                                                                                        {(row
                                                                                            .variantQtys[
                                                                                            String(
                                                                                                variant.id,
                                                                                            )
                                                                                        ] ??
                                                                                            '0') !==
                                                                                            '0' && (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="link"
                                                                                                className="p-0 text-primary"
                                                                                                title={`Clone ${variant.size} qty to all products`}
                                                                                                onClick={() =>
                                                                                                    cloneSize(
                                                                                                        index,
                                                                                                        variant.size,
                                                                                                    )
                                                                                                }
                                                                                                style={{
                                                                                                    fontSize:
                                                                                                        '0.875rem',
                                                                                                }}
                                                                                            >
                                                                                                <i className="ri-file-copy-line"></i>
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    </div>
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
                                                        Search and select
                                                        products above to add
                                                        purchase items.
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
                                                    Total Shirts
                                                </span>
                                                <span className="fw-bold fs-5">
                                                    {totalQtyAll}
                                                </span>
                                            </div>

                                            {Object.entries(categoryBreakdown)
                                                .length > 0 && (
                                                <div>
                                                    <div className="small mb-2 text-muted">
                                                        By Category
                                                    </div>
                                                    <div className="vstack gap-1">
                                                        {Object.entries(
                                                            categoryBreakdown,
                                                        ).map(
                                                            ([
                                                                catName,
                                                                qty,
                                                            ]) => (
                                                                <div
                                                                    key={
                                                                        catName
                                                                    }
                                                                    className="d-flex justify-content-between small"
                                                                >
                                                                    <span>
                                                                        {
                                                                            catName
                                                                        }
                                                                    </span>
                                                                    <span className="fw-medium">
                                                                        {qty}
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <hr className="my-1" />

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
                                            {Number(data.exchange_rate) !==
                                                1 && (
                                                <div className="d-flex justify-content-between small">
                                                    <span className="text-muted">
                                                        Exchange Rate
                                                    </span>
                                                    <span className="fw-medium">
                                                        {data.exchange_rate}
                                                    </span>
                                                </div>
                                            )}
                                            <hr className="my-1" />
                                            <div className="d-flex justify-content-between">
                                                <span className="fw-semibold">
                                                    Total Cost
                                                </span>
                                                <span className="fw-bold fs-5">
                                                    ${totalCost.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="d-grid gap-2">
                                            <Button
                                                type="submit"
                                                variant="success"
                                                disabled={
                                                    processing ||
                                                    totalQtyAll === 0
                                                }
                                            >
                                                {processing
                                                    ? 'Saving...'
                                                    : 'Save Purchase'}
                                            </Button>
                                            <Link
                                                href={purchasesIndex.url()}
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

PurchasesCreate.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default PurchasesCreate;

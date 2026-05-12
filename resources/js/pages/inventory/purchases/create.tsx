import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Table,
} from 'react-bootstrap';
import React from 'react';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import {
    store as purchasesStore,
    index as purchasesIndex,
} from '@/routes/purchases';

type Supplier = { id: number; name: string };
type Category = { id: number; name: string };
type Variant = {
    id: number;
    product_id: number;
    sku: string;
    color: string;
    size: string;
    sale_price_usd: string;
};
type Product = {
    id: number;
    name: string;
    category_id: number;
    variants: Variant[];
};

type LineItem = {
    category_id: string;
    product_id: string;
    product_variant_id: string;
    qty: string;
    unit_cost_usd: string;
    sale_price_usd: string;
};

type FormData = {
    supplier_id: string;
    purchase_date: string;
    purchase_no: string;
    purchase_delivery_cost_usd: string;
    other_cost_usd: string;
    note: string;
    items: LineItem[];
};

type PurchasesCreateProps = {
    suppliers: Supplier[];
    categories: Category[];
    products: Product[];
    purchaseNo: string;
};

const emptyLineItem = (): LineItem => ({
    category_id: '',
    product_id: '',
    product_variant_id: '',
    qty: '1',
    unit_cost_usd: '0',
    sale_price_usd: '0',
});

function PurchasesCreate() {
    const { suppliers, categories, products, purchaseNo } =
        usePage<PurchasesCreateProps>().props;

    const { data, setData, post, processing, errors } = useForm<FormData>({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_no: purchaseNo,
        purchase_delivery_cost_usd: '0',
        other_cost_usd: '0',
        note: '',
        items: [emptyLineItem()],
    });

    const addItem = () => {
        setData('items', [...data.items, emptyLineItem()]);
    };

    const removeItem = (index: number) => {
        setData(
            'items',
            data.items.filter((_: LineItem, i: number) => i !== index),
        );
    };

    const updateItem = (
        index: number,
        field: keyof LineItem,
        value: string,
    ) => {
        const updated = [...data.items];
        updated[index] = { ...updated[index], [field]: value };

        if (field === 'category_id') {
            updated[index] = {
                ...updated[index],
                product_id: '',
                product_variant_id: '',
            };
        }
        if (field === 'product_id') {
            updated[index] = { ...updated[index], product_variant_id: '' };
        }
        if (field === 'product_variant_id') {
            const variant = getVariants(index).find(
                (v: Variant) => String(v.id) === value,
            );
            if (variant) {
                updated[index] = {
                    ...updated[index],
                    sale_price_usd: variant.sale_price_usd || '0',
                };
            }
        }

        setData('items', updated);
    };

    const getProductsByCategory = (categoryId: string): Product[] => {
        if (!categoryId) return products;
        return products.filter(
            (p: Product) => p.category_id === Number(categoryId),
        );
    };

    const getVariants = (index: number): Variant[] => {
        const item = data.items[index];
        if (!item.product_id) return [];
        const product = products.find(
            (p: Product) => p.id === Number(item.product_id),
        );
        return product?.variants || [];
    };

    const subtotal = data.items.reduce(
        (sum: number, item: LineItem) =>
            sum + (Number(item.qty) || 0) * (Number(item.unit_cost_usd) || 0),
        0,
    );

    const totalQty = data.items.reduce(
        (sum: number, item: LineItem) => sum + (Number(item.qty) || 0),
        0,
    );

    const deliveryCost = Number(data.purchase_delivery_cost_usd) || 0;
    const otherCost = Number(data.other_cost_usd) || 0;

    const getLandedCostPerUnit = (item: LineItem): number => {
        const qty = Number(item.qty) || 0;
        const unitCost = Number(item.unit_cost_usd) || 0;
        if (!qty || !totalQty) return unitCost;
        const deliveryAlloc = (deliveryCost * qty) / totalQty;
        const otherAlloc = (otherCost * qty) / totalQty;
        return unitCost + deliveryAlloc / qty + otherAlloc / qty;
    };

    const totalCost = subtotal + deliveryCost + otherCost;

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(purchasesStore.url());
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

                                <Card>
                                    <Card.Body>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h4 className="card-title mb-0">
                                                Line Items
                                            </h4>
                                            <Button
                                                type="button"
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={addItem}
                                            >
                                                + Add Item
                                            </Button>
                                        </div>

                                        <div className="table-responsive">
                                            <Table
                                                striped
                                                hover
                                                className="align-middle"
                                            >
                                                <thead>
                                                    <tr>
                                                        <th>Category</th>
                                                        <th>Product</th>
                                                        <th>Variant</th>
                                                        <th>Qty</th>
                                                        <th>Unit Cost</th>
                                                        <th>Sale Price</th>
                                                        <th>
                                                            Landed Cost/Unit
                                                        </th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.items.map(
                                                        (
                                                            item: LineItem,
                                                            index: number,
                                                        ) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <Form.Select
                                                                        size="sm"
                                                                        value={
                                                                            item.category_id
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                'category_id',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        isInvalid={
                                                                            !!errors[
                                                                                `items.${index}.category_id`
                                                                            ]
                                                                        }
                                                                    >
                                                                        <option value="">
                                                                            Select
                                                                        </option>
                                                                        {categories.map(
                                                                            (
                                                                                c: Category,
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        c.id
                                                                                    }
                                                                                    value={
                                                                                        c.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        c.name
                                                                                    }
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                    </Form.Select>
                                                                </td>
                                                                <td>
                                                                    <Form.Select
                                                                        size="sm"
                                                                        value={
                                                                            item.product_id
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                'product_id',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        isInvalid={
                                                                            !!errors[
                                                                                `items.${index}.product_id`
                                                                            ]
                                                                        }
                                                                    >
                                                                        <option value="">
                                                                            Select
                                                                        </option>
                                                                        {getProductsByCategory(
                                                                            item.category_id,
                                                                        ).map(
                                                                            (
                                                                                p: Product,
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
                                                                </td>
                                                                <td>
                                                                    <Form.Select
                                                                        size="sm"
                                                                        value={
                                                                            item.product_variant_id
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                'product_variant_id',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        isInvalid={
                                                                            !!errors[
                                                                                `items.${index}.product_variant_id`
                                                                            ]
                                                                        }
                                                                    >
                                                                        <option value="">
                                                                            Select
                                                                        </option>
                                                                        {getVariants(
                                                                            index,
                                                                        ).map(
                                                                            (
                                                                                v: Variant,
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        v.id
                                                                                    }
                                                                                    value={
                                                                                        v.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        v.color
                                                                                    }{' '}
                                                                                    /{' '}
                                                                                    {
                                                                                        v.size
                                                                                    }
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                    </Form.Select>
                                                                </td>
                                                                <td>
                                                                    <Form.Control
                                                                        size="sm"
                                                                        type="number"
                                                                        min="1"
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
                                                                        style={{
                                                                            width: 80,
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <Form.Control
                                                                        size="sm"
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={
                                                                            item.unit_cost_usd
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                'unit_cost_usd',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        style={{
                                                                            width: 100,
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <Form.Control
                                                                        size="sm"
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={
                                                                            item.sale_price_usd
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                'sale_price_usd',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        style={{
                                                                            width: 100,
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="text-nowrap">
                                                                    $
                                                                    {getLandedCostPerUnit(
                                                                        item,
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {data.items
                                                                        .length >
                                                                        1 && (
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
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xl={4}>
                                <Card>
                                    <Card.Body>
                                        <h4 className="card-title mb-3">
                                            Cost Summary
                                        </h4>
                                        <div className="vstack gap-2">
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

                                        <div className="d-grid gap-2">
                                            <Button
                                                type="submit"
                                                variant="success"
                                                disabled={processing}
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

PurchasesCreate.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default PurchasesCreate;

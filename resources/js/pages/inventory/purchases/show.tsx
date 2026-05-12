import { Head, Link, usePage } from '@inertiajs/react';
import { Badge, Card, Col, Container, Row, Table } from 'react-bootstrap';
import React from 'react';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { index as purchasesIndex } from '@/routes/purchases';

type Supplier = { id: number; name: string };
type User = { id: number; name: string };
type Category = { id: number; name: string };
type Product = { id: number; name: string };
type ProductVariant = {
    id: number;
    sku: string;
    color: string;
    size: string;
    sale_price_usd: string;
};

type PurchaseItem = {
    id: number;
    category_id: number;
    product_id: number;
    product_variant_id: number;
    qty: number;
    unit_cost_usd: string;
    subtotal_usd: string;
    allocated_delivery_cost_usd: string;
    allocated_other_cost_usd: string;
    landed_unit_cost_usd: string;
    total_landed_cost_usd: string;
    sale_price_usd: string;
    expected_profit_per_unit_usd: string;
    category: Category;
    product: Product;
    productVariant: ProductVariant;
};

type Purchase = {
    id: number;
    purchase_no: string;
    purchase_date: string;
    currency: string;
    exchange_rate: string;
    subtotal_usd: string;
    purchase_delivery_cost_usd: string;
    other_cost_usd: string;
    total_cost_usd: string;
    status: string;
    note: string | null;
    supplier: Supplier;
    createdBy: User;
    items: PurchaseItem[];
};

type PurchasesShowProps = {
    purchase: Purchase;
};

function PurchasesShow() {
    const { purchase } = usePage<PurchasesShowProps>().props;

    const statusBadge = (status: string) => {
        if (status === 'draft') return <Badge bg="warning">Draft</Badge>;
        if (status === 'confirmed')
            return <Badge bg="success">Confirmed</Badge>;
        return <Badge bg="secondary">{status}</Badge>;
    };

    return (
        <>
            <Head title={`Purchase ${purchase.purchase_no}`} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title={purchase.purchase_no}
                        pageTitle="Purchases"
                    />

                    <Row>
                        <Col xl={12}>
                            <Card className="mb-3">
                                <Card.Body>
                                    <div className="d-flex align-items-start justify-content-between mb-3">
                                        <div>
                                            <h4 className="card-title mb-1">
                                                {purchase.purchase_no}
                                            </h4>
                                            <p className="mb-0 text-muted">
                                                Created by{' '}
                                                {purchase.createdBy?.name ||
                                                    '—'}
                                            </p>
                                        </div>
                                        {statusBadge(purchase.status)}
                                    </div>

                                    <Row>
                                        <Col lg={3}>
                                            <div className="mb-2">
                                                <span className="d-block small text-muted">
                                                    Date
                                                </span>
                                                <span className="fw-semibold">
                                                    {purchase.purchase_date}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col lg={3}>
                                            <div className="mb-2">
                                                <span className="d-block small text-muted">
                                                    Supplier
                                                </span>
                                                <span className="fw-semibold">
                                                    {purchase.supplier?.name ||
                                                        '—'}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col lg={3}>
                                            <div className="mb-2">
                                                <span className="d-block small text-muted">
                                                    Currency
                                                </span>
                                                <span className="fw-semibold">
                                                    {purchase.currency}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col lg={3}>
                                            <div className="mb-2">
                                                <span className="d-block small text-muted">
                                                    Exchange Rate
                                                </span>
                                                <span className="fw-semibold">
                                                    {purchase.exchange_rate}
                                                </span>
                                            </div>
                                        </Col>
                                    </Row>

                                    {purchase.note && (
                                        <div className="mt-2">
                                            <span className="d-block small text-muted">
                                                Note
                                            </span>
                                            <span>{purchase.note}</span>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col xl={12}>
                            <Card className="mb-3">
                                <Card.Body>
                                    <h4 className="card-title mb-3">Items</h4>
                                    <div className="table-responsive">
                                        <Table
                                            striped
                                            hover
                                            className="align-middle"
                                        >
                                            <thead>
                                                <tr>
                                                    <th>SKU</th>
                                                    <th>Product</th>
                                                    <th>Color</th>
                                                    <th>Size</th>
                                                    <th>Qty</th>
                                                    <th>Unit Cost</th>
                                                    <th>Landed Unit Cost</th>
                                                    <th>Total</th>
                                                    <th>Sale Price</th>
                                                    <th>Profit/Unit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {purchase.items.map(
                                                    (item: PurchaseItem) => (
                                                        <tr key={item.id}>
                                                            <td>
                                                                {item
                                                                    .productVariant
                                                                    ?.sku ||
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {item.product
                                                                    ?.name ||
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {item
                                                                    .productVariant
                                                                    ?.color ||
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {item
                                                                    .productVariant
                                                                    ?.size ||
                                                                    '—'}
                                                            </td>
                                                            <td>{item.qty}</td>
                                                            <td>
                                                                $
                                                                {Number(
                                                                    item.unit_cost_usd,
                                                                ).toFixed(2)}
                                                            </td>
                                                            <td>
                                                                $
                                                                {Number(
                                                                    item.landed_unit_cost_usd,
                                                                ).toFixed(2)}
                                                            </td>
                                                            <td>
                                                                $
                                                                {Number(
                                                                    item.total_landed_cost_usd,
                                                                ).toFixed(2)}
                                                            </td>
                                                            <td>
                                                                $
                                                                {Number(
                                                                    item.sale_price_usd,
                                                                ).toFixed(2)}
                                                            </td>
                                                            <td>
                                                                $
                                                                {Number(
                                                                    item.expected_profit_per_unit_usd,
                                                                ).toFixed(2)}
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
                    </Row>

                    <Row>
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
                                                $
                                                {Number(
                                                    purchase.subtotal_usd,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Delivery Cost
                                            </span>
                                            <span className="fw-semibold">
                                                $
                                                {Number(
                                                    purchase.purchase_delivery_cost_usd,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Other Cost
                                            </span>
                                            <span className="fw-semibold">
                                                $
                                                {Number(
                                                    purchase.other_cost_usd,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                        <hr className="my-1" />
                                        <div className="d-flex justify-content-between">
                                            <span className="fw-semibold">
                                                Total Cost
                                            </span>
                                            <span className="fw-bold">
                                                $
                                                {Number(
                                                    purchase.total_cost_usd,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <hr />

                                    <Link
                                        href={purchasesIndex.url()}
                                        className="btn btn-outline-secondary w-100"
                                    >
                                        Back to Purchases
                                    </Link>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

PurchasesShow.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default PurchasesShow;

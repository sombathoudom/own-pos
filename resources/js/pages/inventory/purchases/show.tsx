import { Head, Link, usePage } from '@inertiajs/react';
import {
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Modal,
    Row,
    Table,
} from 'react-bootstrap';
import React, { useState } from 'react';
import { router } from '@inertiajs/react';

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
    arrival_date: string | null;
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
    const [showArriveModal, setShowArriveModal] = useState(false);
    const [arriving, setArriving] = useState(false);
    const [arrivalDate, setArrivalDate] = useState(
        new Date().toISOString().split('T')[0],
    );

    const statusBadge = (status: string) => {
        if (status === 'in_transit')
            return <Badge bg="warning">In Transit</Badge>;
        if (status === 'arrived') return <Badge bg="success">Arrived</Badge>;
        if (status === 'draft') return <Badge bg="secondary">Draft</Badge>;
        return <Badge bg="secondary">{status}</Badge>;
    };

    const canArrive = purchase.status === 'in_transit';

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
                                        <div className="d-flex gap-2">
                                            {statusBadge(purchase.status)}
                                            {canArrive && (
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowArriveModal(true)
                                                    }
                                                >
                                                    <i className="ri-check-line me-1"></i>
                                                    Mark Arrived
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <Row>
                                        <Col lg={3}>
                                            <div className="mb-2">
                                                <span className="d-block small text-muted">
                                                    Purchase Date
                                                </span>
                                                <span className="fw-semibold">
                                                    {purchase.purchase_date}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col lg={3}>
                                            <div className="mb-2">
                                                <span className="d-block small text-muted">
                                                    Arrival Date
                                                </span>
                                                <span className="fw-semibold">
                                                    {purchase.arrival_date ||
                                                        '—'}
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

            <Modal
                show={showArriveModal}
                onHide={() => setShowArriveModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Mark Purchase as Arrived</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Mark <strong>{purchase.purchase_no}</strong> as arrived?
                    </p>
                    {parseFloat(purchase.other_cost_usd) > 0 && (
                        <p className="small text-muted">
                            Other cost of $
                            {Number(purchase.other_cost_usd).toFixed(2)} will be
                            added to expenses.
                        </p>
                    )}
                    <Form.Group>
                        <Form.Label>Arrival Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={arrivalDate}
                            onChange={(e) => setArrivalDate(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowArriveModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="success"
                        disabled={arriving}
                        onClick={() => {
                            setArriving(true);
                            router.post(
                                `/purchases/${purchase.id}/arrive`,
                                { arrival_date: arrivalDate },
                                {
                                    onSuccess: () => setShowArriveModal(false),
                                    onError: () => setShowArriveModal(false),
                                    onFinish: () => setArriving(false),
                                },
                            );
                        }}
                    >
                        {arriving ? 'Processing...' : 'Confirm Arrival'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

PurchasesShow.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default PurchasesShow;

import { Head, Link, router, usePage } from '@inertiajs/react';
import { type ReactNode, useMemo, useState } from 'react';
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

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import {
    cancel as saleCancel,
    index as salesIndex,
    returnMethod,
    updatePayment,
} from '@/routes/sales';
import type { SaleShowPageProps } from '@/types';

function SalesShow() {
    const { sale, variants } = usePage<
        SaleShowPageProps & { variants: any[] }
    >().props;
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returning, setReturning] = useState(false);
    const [returnItems, setReturnItems] = useState<Record<number, string>>({});
    const [returnNote, setReturnNote] = useState('');
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [exchanging, setExchanging] = useState(false);
    const [exchangeItems, setExchangeItems] = useState<
        Record<
            number,
            { qty: string; new_variant_id: string; new_unit_price: string }
        >
    >({});
    const [exchangeNote, setExchangeNote] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [updatingPayment, setUpdatingPayment] = useState(false);

    const paymentBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'partial':
                return 'warning';
            default:
                return 'danger';
        }
    };

    const orderBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'danger';
            case 'returned':
                return 'dark';
            case 'partially_returned':
                return 'info';
            default:
                return 'primary';
        }
    };

    const returnedQtyByItem = useMemo(() => {
        const map: Record<number, number> = {};
        sale.returns.forEach((ret) => {
            ret.items.forEach((ri) => {
                map[ri.sale_item_id] = (map[ri.sale_item_id] ?? 0) + ri.qty;
            });
        });
        return map;
    }, [sale.returns]);

    const canReturn =
        sale.order_status !== 'cancelled' && sale.order_status !== 'returned';

    const handleReturnSubmit = () => {
        const items = Object.entries(returnItems)
            .filter(([, qty]) => Number(qty) > 0)
            .map(([saleItemId, qty]) => ({
                sale_item_id: Number(saleItemId),
                qty: Number(qty),
            }));

        if (items.length === 0) {
            setShowReturnModal(false);
            return;
        }

        setReturning(true);
        router.post(
            returnMethod.url(sale.id),
            {
                returned_at: new Date().toISOString().split('T')[0],
                items,
                note: returnNote || undefined,
            },
            {
                onSuccess: () => {
                    setShowReturnModal(false);
                    setReturnItems({});
                    setReturnNote('');
                },
                onError: () => {
                    setShowReturnModal(false);
                },
                onFinish: () => setReturning(false),
            },
        );
    };

    return (
        <>
            <Head title={`Sale ${sale.invoice_no}`} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title={`Sale ${sale.invoice_no}`}
                        pageTitle="Sales"
                    />

                    <Row>
                        <Col xl={8}>
                            <Card className="mb-3">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <div>
                                            <h4 className="card-title mb-1">
                                                {sale.invoice_no}
                                            </h4>
                                            <p className="mb-0 text-muted">
                                                {sale.sale_date}
                                            </p>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <Badge
                                                bg={paymentBadge(
                                                    sale.payment_status,
                                                )}
                                            >
                                                {sale.payment_status}
                                            </Badge>
                                            <Badge
                                                bg={orderBadge(
                                                    sale.order_status,
                                                )}
                                            >
                                                {sale.order_status}
                                            </Badge>
                                            {(sale.payment_status ===
                                                'unpaid' ||
                                                sale.payment_status ===
                                                    'partial') &&
                                                sale.order_status !==
                                                    'cancelled' && (
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setPaymentAmount(
                                                                String(
                                                                    sale.total_usd,
                                                                ),
                                                            );
                                                            setShowPaymentModal(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        Update Payment
                                                    </Button>
                                                )}
                                        </div>
                                    </div>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <div className="small text-muted">
                                                Customer
                                            </div>
                                            <div className="fw-medium">
                                                {sale.customer_name ||
                                                    'Walk-in'}
                                            </div>
                                            {sale.customer_phone && (
                                                <div className="small text-muted">
                                                    {sale.customer_phone}
                                                </div>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            <div className="small text-muted">
                                                Note
                                            </div>
                                            <div>{sale.note || '-'}</div>
                                        </Col>
                                    </Row>

                                    <h5 className="mb-3">Items</h5>
                                    <Table responsive className="mb-0">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Sold Qty</th>
                                                <th>Returned</th>
                                                <th>Unit Price</th>
                                                <th>Discount</th>
                                                <th>Total</th>
                                                <th>COGS</th>
                                                <th>Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sale.items.map((item) => {
                                                const returned =
                                                    returnedQtyByItem[
                                                        item.id
                                                    ] ?? 0;
                                                return (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <div className="fw-medium">
                                                                {item
                                                                    .product_variant
                                                                    ?.product_name ||
                                                                    item
                                                                        .product_variant
                                                                        ?.sku}
                                                            </div>
                                                            <div className="small text-muted">
                                                                {
                                                                    item
                                                                        .product_variant
                                                                        ?.color
                                                                }{' '}
                                                                /{' '}
                                                                {
                                                                    item
                                                                        .product_variant
                                                                        ?.size
                                                                }
                                                            </div>
                                                        </td>
                                                        <td>{item.qty}</td>
                                                        <td>
                                                            {returned > 0 ? (
                                                                <Badge bg="info">
                                                                    {returned}
                                                                </Badge>
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </td>
                                                        <td>
                                                            $
                                                            {Number(
                                                                item.unit_price_usd,
                                                            ).toFixed(2)}
                                                        </td>
                                                        <td>
                                                            $
                                                            {Number(
                                                                item.discount_usd,
                                                            ).toFixed(2)}
                                                        </td>
                                                        <td className="fw-semibold">
                                                            $
                                                            {Number(
                                                                item.total_usd,
                                                            ).toFixed(2)}
                                                        </td>
                                                        <td>
                                                            $
                                                            {Number(
                                                                item.cogs_usd,
                                                            ).toFixed(2)}
                                                        </td>
                                                        <td
                                                            className={
                                                                Number(
                                                                    item.profit_usd,
                                                                ) >= 0
                                                                    ? 'text-success'
                                                                    : 'text-danger'
                                                            }
                                                        >
                                                            $
                                                            {Number(
                                                                item.profit_usd,
                                                            ).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>

                            {sale.returns.length > 0 && (
                                <Card className="mb-3">
                                    <Card.Body>
                                        <h5 className="mb-3">Returns</h5>
                                        {sale.returns.map((ret) => (
                                            <div
                                                key={ret.id}
                                                className="border-bottom mb-3 pb-2"
                                            >
                                                <div className="d-flex justify-content-between small mb-1 text-muted">
                                                    <span>
                                                        Return #{ret.id}{' '}
                                                        &middot;{' '}
                                                        {ret.returned_at}
                                                    </span>
                                                    <span className="fw-semibold">
                                                        $
                                                        {Number(
                                                            ret.total_refund_usd,
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                                <Table
                                                    size="sm"
                                                    responsive
                                                    className="mb-0"
                                                >
                                                    <thead>
                                                        <tr>
                                                            <th>Item</th>
                                                            <th>Qty</th>
                                                            <th>Refund</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {ret.items.map((ri) => {
                                                            const saleItem =
                                                                sale.items.find(
                                                                    (i) =>
                                                                        i.id ===
                                                                        ri.sale_item_id,
                                                                );
                                                            return (
                                                                <tr key={ri.id}>
                                                                    <td>
                                                                        {saleItem
                                                                            ?.product_variant
                                                                            ?.product_name ||
                                                                            saleItem
                                                                                ?.product_variant
                                                                                ?.sku ||
                                                                            '-'}
                                                                    </td>
                                                                    <td>
                                                                        {ri.qty}
                                                                    </td>
                                                                    <td>
                                                                        $
                                                                        {Number(
                                                                            ri.refund_usd,
                                                                        ).toFixed(
                                                                            2,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </Table>
                                                {ret.note && (
                                                    <div className="small mt-1 text-muted">
                                                        {ret.note}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            )}

                            {sale.items.some(
                                (i) => i.cost_layers.length > 0,
                            ) && (
                                <Card>
                                    <Card.Body>
                                        <h5 className="mb-3">
                                            FIFO Cost Layers
                                        </h5>
                                        {sale.items.map((item) =>
                                            item.cost_layers.length > 0 ? (
                                                <div
                                                    key={item.id}
                                                    className="mb-3"
                                                >
                                                    <div className="fw-medium small">
                                                        {item.product_variant
                                                            ?.product_name ||
                                                            item.product_variant
                                                                ?.sku}
                                                    </div>
                                                    <Table
                                                        size="sm"
                                                        responsive
                                                        className="mb-0"
                                                    >
                                                        <thead>
                                                            <tr>
                                                                <th>
                                                                    Layer Qty
                                                                </th>
                                                                <th>
                                                                    Unit Cost
                                                                </th>
                                                                <th>
                                                                    Total Cost
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {item.cost_layers.map(
                                                                (cl, idx) => (
                                                                    <tr
                                                                        key={
                                                                            idx
                                                                        }
                                                                    >
                                                                        <td>
                                                                            {
                                                                                cl.qty
                                                                            }
                                                                        </td>
                                                                        <td>
                                                                            $
                                                                            {Number(
                                                                                cl.unit_cost_usd,
                                                                            ).toFixed(
                                                                                2,
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            $
                                                                            {Number(
                                                                                cl.total_cost_usd,
                                                                            ).toFixed(
                                                                                2,
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            ) : null,
                                        )}
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        <Col xl={4}>
                            <Card>
                                <Card.Body>
                                    <h4 className="card-title mb-3">Summary</h4>
                                    <div className="vstack gap-2">
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Subtotal
                                            </span>
                                            <span className="fw-semibold">
                                                $
                                                {Number(
                                                    sale.subtotal_usd,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Discount
                                            </span>
                                            <span className="fw-semibold">
                                                $
                                                {Number(
                                                    sale.discount_usd,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Delivery Fee
                                            </span>
                                            <span className="fw-semibold">
                                                $
                                                {Number(
                                                    sale.customer_delivery_fee_usd,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                        <hr className="my-1" />
                                        <div className="d-flex justify-content-between">
                                            <span className="fw-semibold">
                                                Total
                                            </span>
                                            <span className="fw-bold">
                                                $
                                                {Number(sale.total_usd).toFixed(
                                                    2,
                                                )}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Paid
                                            </span>
                                            <span className="fw-semibold">
                                                $
                                                {Number(sale.paid_usd).toFixed(
                                                    2,
                                                )}
                                            </span>
                                        </div>
                                        {Number(sale.total_usd) >
                                            Number(sale.paid_usd) && (
                                            <div className="d-flex justify-content-between">
                                                <span className="text-danger">
                                                    Due
                                                </span>
                                                <span className="fw-bold text-danger">
                                                    $
                                                    {(
                                                        Number(sale.total_usd) -
                                                        Number(sale.paid_usd)
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <hr className="my-1" />
                                        <div className="d-flex justify-content-between">
                                            <span className="fw-semibold">
                                                Total COGS
                                            </span>
                                            <span>
                                                $
                                                {sale.items
                                                    .reduce(
                                                        (sum, i) =>
                                                            sum +
                                                            Number(i.cogs_usd),
                                                        0,
                                                    )
                                                    .toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="fw-semibold">
                                                Total Profit
                                            </span>
                                            <span
                                                className={
                                                    sale.items.reduce(
                                                        (sum, i) =>
                                                            sum +
                                                            Number(
                                                                i.profit_usd,
                                                            ),
                                                        0,
                                                    ) >= 0
                                                        ? 'text-success fw-bold'
                                                        : 'text-danger fw-bold'
                                                }
                                            >
                                                $
                                                {sale.items
                                                    .reduce(
                                                        (sum, i) =>
                                                            sum +
                                                            Number(
                                                                i.profit_usd,
                                                            ),
                                                        0,
                                                    )
                                                    .toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <hr />

                                    {canReturn && (
                                        <>
                                            <Button
                                                variant="outline-warning"
                                                className="mb-2 w-100"
                                                onClick={() =>
                                                    setShowReturnModal(true)
                                                }
                                            >
                                                <i className="ri-arrow-go-back-line me-1" />
                                                Return Items
                                            </Button>
                                            <Button
                                                variant="outline-info"
                                                className="mb-2 w-100"
                                                onClick={() =>
                                                    setShowExchangeModal(true)
                                                }
                                            >
                                                <i className="ri-exchange-line me-1" />
                                                Exchange Items
                                            </Button>
                                        </>
                                    )}

                                    {sale.order_status !== 'cancelled' &&
                                        sale.order_status !== 'returned' && (
                                            <Button
                                                variant="outline-danger"
                                                className="mb-2 w-100"
                                                onClick={() =>
                                                    setShowCancelModal(true)
                                                }
                                            >
                                                <i className="ri-close-circle-line me-1" />
                                                Cancel Sale
                                            </Button>
                                        )}

                                    <Link
                                        href={`/sales/${sale.id}/delivery`}
                                        className="btn btn-outline-info mb-2 w-100"
                                    >
                                        <i className="ri-truck-line me-1" />{' '}
                                        Delivery
                                    </Link>
                                    <Link
                                        href={`/sales/${sale.id}/packaging`}
                                        className="btn btn-outline-secondary mb-2 w-100"
                                    >
                                        <i className="ri-archive-line me-1" />{' '}
                                        Packaging
                                    </Link>
                                    <Link
                                        href={salesIndex.url()}
                                        className="btn btn-light w-100"
                                    >
                                        Back to Sales
                                    </Link>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            <Modal
                show={showCancelModal}
                onHide={() => setShowCancelModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Cancel Sale</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Are you sure you want to cancel{' '}
                        <strong>{sale.invoice_no}</strong>?
                    </p>
                    <p className="small mb-0 text-muted">
                        This will restore all stock quantities back to their
                        original layers and record reversal movements.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowCancelModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="danger"
                        disabled={cancelling}
                        onClick={() => {
                            setCancelling(true);
                            router.post(
                                saleCancel.url(sale.id),
                                {},
                                {
                                    onSuccess: () => setShowCancelModal(false),
                                    onError: () => setShowCancelModal(false),
                                    onFinish: () => setCancelling(false),
                                },
                            );
                        }}
                    >
                        {cancelling ? 'Cancelling...' : 'Yes, Cancel Sale'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={showReturnModal}
                onHide={() => setShowReturnModal(false)}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Return Items</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table responsive className="mb-3">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Sold</th>
                                <th>Already Returned</th>
                                <th>Return Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item) => {
                                const returned =
                                    returnedQtyByItem[item.id] ?? 0;
                                const maxReturn = item.qty - returned;
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="fw-medium">
                                                {item.product_variant
                                                    ?.product_name ||
                                                    item.product_variant?.sku}
                                            </div>
                                            <div className="small text-muted">
                                                {item.product_variant?.color} /{' '}
                                                {item.product_variant?.size}
                                            </div>
                                        </td>
                                        <td>{item.qty}</td>
                                        <td>{returned}</td>
                                        <td style={{ width: 120 }}>
                                            <Form.Control
                                                type="number"
                                                min={0}
                                                max={maxReturn}
                                                value={
                                                    returnItems[item.id] ?? ''
                                                }
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (
                                                        val === '' ||
                                                        Number(val) <= maxReturn
                                                    ) {
                                                        setReturnItems(
                                                            (prev) => ({
                                                                ...prev,
                                                                [item.id]: val,
                                                            }),
                                                        );
                                                    }
                                                }}
                                                placeholder="0"
                                                disabled={maxReturn <= 0}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    <Form.Group>
                        <Form.Label>Note</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={returnNote}
                            onChange={(e) => setReturnNote(e.target.value)}
                            placeholder="Optional reason for return..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowReturnModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="warning"
                        disabled={returning}
                        onClick={handleReturnSubmit}
                    >
                        {returning ? 'Processing...' : 'Process Return'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={showExchangeModal}
                onHide={() => setShowExchangeModal(false)}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Exchange Items</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table responsive className="mb-3">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Sold</th>
                                <th>Already Returned</th>
                                <th>Exchange Qty</th>
                                <th>New Variant</th>
                                <th>New Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item) => {
                                const returned =
                                    returnedQtyByItem[item.id] ?? 0;
                                const maxExchange = item.qty - returned;
                                const exchangeData = exchangeItems[item.id] ?? {
                                    qty: '',
                                    new_variant_id: '',
                                    new_unit_price: '',
                                };
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="fw-medium">
                                                {item.product_variant
                                                    ?.product_name ||
                                                    item.product_variant?.sku}
                                            </div>
                                            <div className="small text-muted">
                                                {item.product_variant?.color} /{' '}
                                                {item.product_variant?.size}
                                            </div>
                                        </td>
                                        <td>{item.qty}</td>
                                        <td>{returned}</td>
                                        <td style={{ width: 80 }}>
                                            <Form.Control
                                                type="number"
                                                min={0}
                                                max={maxExchange}
                                                value={exchangeData.qty}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (
                                                        val === '' ||
                                                        Number(val) <=
                                                            maxExchange
                                                    ) {
                                                        setExchangeItems(
                                                            (prev) => ({
                                                                ...prev,
                                                                [item.id]: {
                                                                    ...exchangeData,
                                                                    qty: val,
                                                                },
                                                            }),
                                                        );
                                                    }
                                                }}
                                                placeholder="0"
                                                disabled={maxExchange <= 0}
                                                size="sm"
                                            />
                                        </td>
                                        <td style={{ width: 180 }}>
                                            <Form.Select
                                                value={
                                                    exchangeData.new_variant_id
                                                }
                                                onChange={(e) =>
                                                    setExchangeItems(
                                                        (prev) => ({
                                                            ...prev,
                                                            [item.id]: {
                                                                ...exchangeData,
                                                                new_variant_id:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        }),
                                                    )
                                                }
                                                size="sm"
                                                disabled={maxExchange <= 0}
                                            >
                                                <option value="">
                                                    Select...
                                                </option>
                                                {variants.map((v) => (
                                                    <option
                                                        key={v.id}
                                                        value={v.id}
                                                    >
                                                        {v.sku} -{' '}
                                                        {v.product.name} (
                                                        {v.size})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </td>
                                        <td style={{ width: 100 }}>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                value={
                                                    exchangeData.new_unit_price
                                                }
                                                onChange={(e) =>
                                                    setExchangeItems(
                                                        (prev) => ({
                                                            ...prev,
                                                            [item.id]: {
                                                                ...exchangeData,
                                                                new_unit_price:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        }),
                                                    )
                                                }
                                                placeholder="0.00"
                                                disabled={maxExchange <= 0}
                                                size="sm"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    <Form.Group>
                        <Form.Label>Note</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={exchangeNote}
                            onChange={(e) => setExchangeNote(e.target.value)}
                            placeholder="Optional reason for exchange..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowExchangeModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="info"
                        disabled={exchanging}
                        onClick={() => {
                            const items = Object.entries(exchangeItems)
                                .filter(
                                    ([, data]) =>
                                        Number(data.qty) > 0 &&
                                        data.new_variant_id &&
                                        data.new_unit_price,
                                )
                                .map(([saleItemId, data]) => ({
                                    sale_item_id: Number(saleItemId),
                                    qty: Number(data.qty),
                                    new_variant_id: Number(data.new_variant_id),
                                    new_unit_price: data.new_unit_price,
                                }));

                            if (items.length === 0) {
                                setShowExchangeModal(false);
                                return;
                            }

                            setExchanging(true);
                            router.post(
                                `/sales/${sale.id}/exchange`,
                                { items, note: exchangeNote || undefined },
                                {
                                    onSuccess: () => {
                                        setShowExchangeModal(false);
                                        setExchangeItems({});
                                        setExchangeNote('');
                                    },
                                    onError: () => {
                                        setShowExchangeModal(false);
                                    },
                                    onFinish: () => setExchanging(false),
                                },
                            );
                        }}
                    >
                        {exchanging ? 'Processing...' : 'Process Exchange'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Update Payment Modal */}
            <Modal
                show={showPaymentModal}
                onHide={() => setShowPaymentModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Update Payment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <div className="d-flex justify-content-between small text-muted">
                            <span>Total Amount</span>
                            <span>${Number(sale.total_usd).toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between small text-muted">
                            <span>Previously Paid</span>
                            <span>${Number(sale.paid_usd).toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between fw-bold">
                            <span>Due</span>
                            <span className="text-danger">
                                $
                                {Math.max(
                                    0,
                                    Number(sale.total_usd) -
                                        Number(sale.paid_usd),
                                ).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <Form.Group className="mb-3">
                        <Form.Label>New Paid Amount</Form.Label>
                        <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="Enter total paid amount"
                        />
                        <Form.Text className="text-muted">
                            Enter the new total paid amount (not the additional
                            amount).
                        </Form.Text>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Note</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={paymentNote}
                            onChange={(e) => setPaymentNote(e.target.value)}
                            placeholder="Optional payment note..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowPaymentModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        disabled={updatingPayment}
                        onClick={() => {
                            setUpdatingPayment(true);
                            router.post(
                                updatePayment.url(sale.id),
                                {
                                    paid_usd: paymentAmount,
                                    payment_note: paymentNote || undefined,
                                },
                                {
                                    onSuccess: () => {
                                        setShowPaymentModal(false);
                                        setPaymentAmount('');
                                        setPaymentNote('');
                                    },
                                    onError: () => {
                                        setShowPaymentModal(false);
                                    },
                                    onFinish: () => setUpdatingPayment(false),
                                },
                            );
                        }}
                    >
                        {updatingPayment ? 'Updating...' : 'Update Payment'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

SalesShow.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default SalesShow;

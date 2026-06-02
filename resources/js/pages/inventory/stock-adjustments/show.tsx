import { Head, Link, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Col,
    Container,
    Modal,
    Row,
    Table,
} from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import {
    approve as adjustmentsApprove,
    index as adjustmentsIndex,
} from '@/routes/stock-adjustments';

type AdjustmentItem = {
    id: number;
    system_qty: number;
    actual_qty: number;
    difference_qty: number;
    movement_type: string;
    note: string | null;
    productVariant: {
        sku: string;
        color: string | null;
        size: string;
        product: { name: string };
    };
};

type Movement = {
    id: number;
    type: string;
    qty_change: number;
    note: string | null;
    created_at: string;
    sku: string;
};

type Adjustment = {
    id: number;
    adjustment_date: string;
    reason: string | null;
    note: string | null;
    approved_at: string | null;
    created_by: string | null;
    approved_by: string | null;
    items: AdjustmentItem[];
    movements: Movement[];
};

function StockAdjustmentsShow() {
    const { adjustment } = usePage<{ adjustment: Adjustment }>().props;
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approving, setApproving] = useState(false);

    const isApproved = !!adjustment.approved_at;

    const handleApprove = () => {
        setApproving(true);
        router.post(
            adjustmentsApprove(adjustment.id).url,
            {},
            {
                onFinish: () => {
                    setApproving(false);
                    setShowApproveModal(false);
                },
            },
        );
    };

    return (
        <>
            <Head title={`Adjustment #${adjustment.id}`} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title={`Adjustment #${adjustment.id}`}
                        pageTitle="Inventory"
                    />
                    <Row>
                        <Col lg={8}>
                            {/* Header card */}
                            <Card className="mb-3">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h4 className="card-title mb-2">
                                                Stock Adjustment #
                                                {adjustment.id}
                                            </h4>
                                            <div className="vstack small gap-1 text-muted">
                                                <span>
                                                    Date:{' '}
                                                    {adjustment.adjustment_date}
                                                </span>
                                                {adjustment.reason && (
                                                    <span>
                                                        Reason:{' '}
                                                        {adjustment.reason}
                                                    </span>
                                                )}
                                                {adjustment.note && (
                                                    <span>
                                                        Note: {adjustment.note}
                                                    </span>
                                                )}
                                                <span>
                                                    Created by:{' '}
                                                    {adjustment.created_by ??
                                                        '—'}
                                                </span>
                                                {isApproved && (
                                                    <span>
                                                        Approved by:{' '}
                                                        {adjustment.approved_by ??
                                                            '—'}{' '}
                                                        at{' '}
                                                        {adjustment.approved_at}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <Badge
                                                bg={
                                                    isApproved
                                                        ? 'success'
                                                        : 'warning'
                                                }
                                            >
                                                {isApproved
                                                    ? 'Approved'
                                                    : 'Pending'}
                                            </Badge>
                                            {!isApproved && (
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowApproveModal(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    Approve
                                                </Button>
                                            )}
                                            <Link
                                                href={adjustmentsIndex.url()}
                                                className="btn btn-light btn-sm"
                                            >
                                                Back
                                            </Link>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Items card */}
                            <Card className="mb-3">
                                <Card.Body>
                                    <h5 className="card-title mb-3">
                                        Adjustment Items
                                    </h5>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Variant</th>
                                                <th>System Qty</th>
                                                <th>Actual Qty</th>
                                                <th>Change</th>
                                                <th>Type</th>
                                                <th>Note</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adjustment.items?.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <div className="fw-medium">
                                                            {
                                                                item
                                                                    .productVariant
                                                                    ?.product
                                                                    ?.name
                                                            }
                                                        </div>
                                                        <div className="small font-monospace text-muted">
                                                            {
                                                                item
                                                                    .productVariant
                                                                    ?.sku
                                                            }
                                                            {item.productVariant
                                                                ?.color &&
                                                                ` · ${item.productVariant.color}`}
                                                            {` · ${item.productVariant?.size}`}
                                                        </div>
                                                    </td>
                                                    <td>{item.system_qty}</td>
                                                    <td>{item.actual_qty}</td>
                                                    <td
                                                        className={
                                                            item.difference_qty >
                                                            0
                                                                ? 'text-success fw-semibold'
                                                                : item.difference_qty <
                                                                    0
                                                                  ? 'text-danger fw-semibold'
                                                                  : ''
                                                        }
                                                    >
                                                        {item.difference_qty > 0
                                                            ? '+'
                                                            : ''}
                                                        {item.difference_qty}
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg={
                                                                item.movement_type ===
                                                                'adjustment_in'
                                                                    ? 'success'
                                                                    : 'danger'
                                                            }
                                                        >
                                                            {item.movement_type ===
                                                            'adjustment_in'
                                                                ? 'In'
                                                                : 'Out'}
                                                        </Badge>
                                                    </td>
                                                    <td className="small text-muted">
                                                        {item.note ?? '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!adjustment.items ||
                                                adjustment.items.length ===
                                                    0) && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="text-center text-muted"
                                                    >
                                                        No items.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>

                            {/* Stock movements card — only shown after approval */}
                            {isApproved && adjustment.movements.length > 0 && (
                                <Card>
                                    <Card.Body>
                                        <h5 className="card-title mb-3">
                                            Stock Movements
                                        </h5>
                                        <Table
                                            responsive
                                            className="small align-middle"
                                        >
                                            <thead>
                                                <tr>
                                                    <th>SKU</th>
                                                    <th>Type</th>
                                                    <th>Qty Change</th>
                                                    <th>Note</th>
                                                    <th>At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {adjustment.movements.map(
                                                    (m) => (
                                                        <tr key={m.id}>
                                                            <td className="font-monospace">
                                                                {m.sku}
                                                            </td>
                                                            <td>
                                                                <Badge
                                                                    bg={
                                                                        m.qty_change >
                                                                        0
                                                                            ? 'success'
                                                                            : 'danger'
                                                                    }
                                                                >
                                                                    {m.type}
                                                                </Badge>
                                                            </td>
                                                            <td
                                                                className={
                                                                    m.qty_change >
                                                                    0
                                                                        ? 'text-success'
                                                                        : 'text-danger'
                                                                }
                                                            >
                                                                {m.qty_change >
                                                                0
                                                                    ? '+'
                                                                    : ''}
                                                                {m.qty_change}
                                                            </td>
                                                            <td className="text-muted">
                                                                {m.note ?? '—'}
                                                            </td>
                                                            <td className="text-muted">
                                                                {m.created_at}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>
                    </Row>
                </Container>
            </div>

            <Modal
                show={showApproveModal}
                onHide={() => setShowApproveModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Approve Adjustment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Approve stock adjustment{' '}
                        <strong>#{adjustment.id}</strong>?
                    </p>
                    <p className="small mb-0 text-muted">
                        This will apply {adjustment.items?.length} change(s) to
                        stock immediately and cannot be undone.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowApproveModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        disabled={approving}
                        onClick={handleApprove}
                    >
                        {approving ? 'Approving...' : 'Confirm Approve'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

StockAdjustmentsShow.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default StockAdjustmentsShow;

import { Head, Link, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { Badge, Card, Col, Container, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { index as adjustmentsIndex } from '@/routes/stock-adjustments';
import type { InventoryStockAdjustment } from '@/types';

function StockAdjustmentsShow() {
    const { adjustment } = usePage<{ adjustment: InventoryStockAdjustment }>()
        .props;

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
                            <Card>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h4 className="card-title">
                                                Stock Adjustment #
                                                {adjustment.id}
                                            </h4>
                                            <p className="mb-1 text-muted">
                                                Date:{' '}
                                                {adjustment.adjustment_date}
                                            </p>
                                            <p className="mb-1 text-muted">
                                                Reason:{' '}
                                                {adjustment.reason ?? '-'}
                                            </p>
                                            <Badge
                                                bg={
                                                    adjustment.approved_at
                                                        ? 'success'
                                                        : 'warning'
                                                }
                                            >
                                                {adjustment.approved_at
                                                    ? 'Approved'
                                                    : 'Pending'}
                                            </Badge>
                                        </div>
                                        <Link
                                            href={adjustmentsIndex.url()}
                                            className="btn btn-light"
                                        >
                                            Back
                                        </Link>
                                    </div>

                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Variant</th>
                                                <th>System Qty</th>
                                                <th>Actual Qty</th>
                                                <th>Difference</th>
                                                <th>Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adjustment.items?.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        {
                                                            item.productVariant
                                                                ?.sku
                                                        }{' '}
                                                        -{' '}
                                                        {
                                                            item.productVariant
                                                                ?.product?.name
                                                        }{' '}
                                                        (
                                                        {
                                                            item.productVariant
                                                                ?.size
                                                        }
                                                        )
                                                    </td>
                                                    <td>{item.system_qty}</td>
                                                    <td>{item.actual_qty}</td>
                                                    <td
                                                        className={
                                                            item.difference_qty >
                                                            0
                                                                ? 'text-success'
                                                                : item.difference_qty <
                                                                    0
                                                                  ? 'text-danger'
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
                                                            {item.movement_type}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!adjustment.items ||
                                                adjustment.items.length ===
                                                    0) && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
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
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

StockAdjustmentsShow.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default StockAdjustmentsShow;

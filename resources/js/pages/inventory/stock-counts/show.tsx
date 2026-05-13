import { Head, Link, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { Badge, Card, Col, Container, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import type { InventoryStockCount } from '@/types';

function StockCountsShow() {
    const { count } = usePage<{ count: InventoryStockCount }>().props;

    return (
        <>
            <Head title={`Count #${count.id}`} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title={`Count #${count.id}`}
                        pageTitle="Inventory"
                    />
                    <Row>
                        <Col lg={8}>
                            <Card>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h4 className="card-title">
                                                Stock Count #{count.id}
                                            </h4>
                                            <p className="mb-1 text-muted">
                                                Date: {count.count_date}
                                            </p>
                                            <Badge
                                                bg={
                                                    count.status === 'adjusted'
                                                        ? 'success'
                                                        : count.status ===
                                                            'draft'
                                                          ? 'warning'
                                                          : 'secondary'
                                                }
                                            >
                                                {count.status}
                                            </Badge>
                                        </div>
                                        <Link
                                            href="/stock-counts"
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
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {count.items?.map((item) => (
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
                                                </tr>
                                            ))}
                                            {(!count.items ||
                                                count.items.length === 0) && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
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

StockCountsShow.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default StockCountsShow;

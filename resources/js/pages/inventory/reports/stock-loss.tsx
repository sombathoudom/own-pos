import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Badge, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';

function ReportsStockLoss() {
    const { from, to, movements, totalLoss } = usePage<{
        from: string;
        to: string;
        movements: any;
        totalLoss: string;
    }>().props;
    const [fromDate, setFromDate] = useState(from);
    const [toDate, setToDate] = useState(to);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/reports/stock-loss',
            { from: fromDate, to: toDate },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Stock Loss Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Stock Loss Report" pageTitle="Reports" />
                    <Row>
                        <Col xs={12}>
                            <Card>
                                <Card.Body>
                                    <Form
                                        onSubmit={submit}
                                        className="d-flex mb-4 gap-2"
                                    >
                                        <Form.Control
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) =>
                                                setFromDate(e.target.value)
                                            }
                                        />
                                        <Form.Control
                                            type="date"
                                            value={toDate}
                                            onChange={(e) =>
                                                setToDate(e.target.value)
                                            }
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                        >
                                            Filter
                                        </button>
                                    </Form>

                                    <h4 className="card-title mb-3">
                                        Stock Loss: {from} to {to}
                                    </h4>
                                    <Row className="mb-4">
                                        <Col md={4}>
                                            <Card className="bg-soft-danger">
                                                <Card.Body>
                                                    <h5>${totalLoss}</h5>
                                                    <p className="mb-0">
                                                        Total Loss Value
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Variant</th>
                                                <th>Type</th>
                                                <th>Qty</th>
                                                <th>Unit Cost</th>
                                                <th>Loss Value</th>
                                                <th>Note</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movements.data.map(
                                                (movement: any) => (
                                                    <tr key={movement.id}>
                                                        <td>
                                                            {new Date(
                                                                movement.created_at,
                                                            ).toLocaleDateString()}
                                                        </td>
                                                        <td>
                                                            {
                                                                movement
                                                                    .product_variant
                                                                    ?.sku
                                                            }{' '}
                                                            -{' '}
                                                            {
                                                                movement
                                                                    .product_variant
                                                                    ?.product
                                                                    ?.name
                                                            }
                                                        </td>
                                                        <td>
                                                            <Badge bg="danger">
                                                                {movement.type}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            {Math.abs(
                                                                movement.qty_change,
                                                            )}
                                                        </td>
                                                        <td>
                                                            $
                                                            {movement.unit_cost_usd ??
                                                                '0'}
                                                        </td>
                                                        <td>
                                                            $
                                                            {movement.unit_cost_usd
                                                                ? (
                                                                      Math.abs(
                                                                          movement.qty_change,
                                                                      ) *
                                                                      parseFloat(
                                                                          movement.unit_cost_usd,
                                                                      )
                                                                  ).toFixed(2)
                                                                : '0'}
                                                        </td>
                                                        <td>
                                                            {movement.note ??
                                                                '-'}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                            {movements.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="text-center text-muted"
                                                    >
                                                        No stock loss records
                                                        found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                    <Pagination paginator={movements} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

ReportsStockLoss.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsStockLoss;

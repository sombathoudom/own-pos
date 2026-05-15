import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Badge, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import ReportsNav from '@/Components/Inventory/ReportsNav';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';

function ReportsDeliveryFailed() {
    const { from, to, deliveries, totalFailed } = usePage<{
        from: string;
        to: string;
        deliveries: any;
        totalFailed: number;
    }>().props;
    const [fromDate, setFromDate] = useState(from);
    const [toDate, setToDate] = useState(to);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/reports/delivery-failed',
            { from: fromDate, to: toDate },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Delivery Failed Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Delivery Failed Report"
                        pageTitle="Reports"
                    />
                    <ReportsNav active="delivery-failed" />
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
                                        Failed/Returned Deliveries: {from} to{' '}
                                        {to}
                                    </h4>
                                    <Row className="mb-4">
                                        <Col md={4}>
                                            <Card className="bg-soft-danger">
                                                <Card.Body>
                                                    <h5>{totalFailed}</h5>
                                                    <p className="mb-0">
                                                        Total Failed
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Invoice</th>
                                                <th>Status</th>
                                                <th>Customer Fee</th>
                                                <th>Actual Cost</th>
                                                <th>Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deliveries.data.map(
                                                (delivery: any) => (
                                                    <tr key={delivery.id}>
                                                        <td>
                                                            {new Date(
                                                                delivery.created_at,
                                                            ).toLocaleDateString()}
                                                        </td>
                                                        <td>
                                                            {
                                                                delivery.sale
                                                                    ?.invoice_no
                                                            }
                                                        </td>
                                                        <td>
                                                            <Badge
                                                                bg={
                                                                    delivery.delivery_status ===
                                                                    'failed'
                                                                        ? 'danger'
                                                                        : 'warning'
                                                                }
                                                            >
                                                                {
                                                                    delivery.delivery_status
                                                                }
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            $
                                                            {
                                                                delivery.customer_delivery_fee_usd
                                                            }
                                                        </td>
                                                        <td>
                                                            $
                                                            {
                                                                delivery.actual_delivery_cost_usd
                                                            }
                                                        </td>
                                                        <td>
                                                            {delivery.failed_reason ??
                                                                '-'}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                            {deliveries.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="text-center text-muted"
                                                    >
                                                        No failed deliveries
                                                        found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                    <Pagination paginator={deliveries} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

ReportsDeliveryFailed.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsDeliveryFailed;

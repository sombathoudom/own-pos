import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';

function ReportsMonthly() {
    const { month, summary, top_selling } = usePage<{
        month: string;
        summary: Record<string, string | number>;
        top_selling: any[];
    }>().props;
    const [selectedMonth, setSelectedMonth] = useState(month);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/reports/monthly',
            { month: selectedMonth },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Monthly Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Monthly Report" pageTitle="Reports" />
                    <Row>
                        <Col xs={12}>
                            <Card>
                                <Card.Body>
                                    <Form
                                        onSubmit={submit}
                                        className="d-flex mb-4 gap-2"
                                    >
                                        <Form.Control
                                            type="month"
                                            value={selectedMonth}
                                            onChange={(e) =>
                                                setSelectedMonth(e.target.value)
                                            }
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                        >
                                            View
                                        </button>
                                    </Form>

                                    <h4 className="card-title mb-3">
                                        Summary for {month}
                                    </h4>
                                    <Row className="mb-4">
                                        <Col md={3}>
                                            <Card className="bg-soft-primary">
                                                <Card.Body>
                                                    <h5>
                                                        ${summary.total_revenue}
                                                    </h5>
                                                    <p className="mb-0">
                                                        Total Revenue
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="bg-soft-success">
                                                <Card.Body>
                                                    <h5>
                                                        ${summary.net_profit}
                                                    </h5>
                                                    <p className="mb-0">
                                                        Net Profit
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="bg-soft-info">
                                                <Card.Body>
                                                    <h5>
                                                        {summary.total_qty_sold}
                                                    </h5>
                                                    <p className="mb-0">
                                                        Shirts Sold
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="bg-soft-warning">
                                                <Card.Body>
                                                    <h5>
                                                        $
                                                        {summary.total_expenses}
                                                    </h5>
                                                    <p className="mb-0">
                                                        Expenses
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <h5 className="mb-3">
                                        Top Selling Products
                                    </h5>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Variant ID</th>
                                                <th>Qty Sold</th>
                                                <th>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {top_selling.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.variant_id}</td>
                                                    <td>{item.qty}</td>
                                                    <td>${item.revenue}</td>
                                                </tr>
                                            ))}
                                            {top_selling.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="text-center text-muted"
                                                    >
                                                        No data.
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

ReportsMonthly.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsMonthly;

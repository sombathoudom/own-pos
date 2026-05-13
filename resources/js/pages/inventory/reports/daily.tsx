import { Head, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { Card, Col, Container, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';

function ReportsDaily() {
    const { date, sales, closings } = usePage<{
        date: string;
        sales: any[];
        closings: any[];
    }>().props;

    const totalSales = sales
        .reduce((sum, s) => sum + parseFloat(s.subtotal_usd), 0)
        .toFixed(2);
    const totalProfit = sales
        .reduce(
            (sum, s) =>
                sum +
                parseFloat(
                    s.items?.reduce(
                        (is: number, i: any) => is + parseFloat(i.profit_usd),
                        0,
                    ) ?? 0,
                ),
            0,
        )
        .toFixed(2);

    return (
        <>
            <Head title="Daily Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Daily Report" pageTitle="Reports" />
                    <Row>
                        <Col xs={12}>
                            <Card>
                                <Card.Body>
                                    <h4 className="card-title">
                                        Daily Report: {date}
                                    </h4>
                                    <Row className="mb-4">
                                        <Col md={3}>
                                            <Card className="bg-soft-primary">
                                                <Card.Body>
                                                    <h5>${totalSales}</h5>
                                                    <p className="mb-0">
                                                        Total Sales
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="bg-soft-success">
                                                <Card.Body>
                                                    <h5>${totalProfit}</h5>
                                                    <p className="mb-0">
                                                        Total Profit
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="bg-soft-info">
                                                <Card.Body>
                                                    <h5>{sales.length}</h5>
                                                    <p className="mb-0">
                                                        Orders
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="bg-soft-warning">
                                                <Card.Body>
                                                    <h5>
                                                        {closings.length > 0
                                                            ? 'Closed'
                                                            : 'Open'}
                                                    </h5>
                                                    <p className="mb-0">
                                                        Day Status
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                    <h5 className="mb-3">Sales</h5>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Invoice</th>
                                                <th>Customer</th>
                                                <th>Status</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.map((sale) => (
                                                <tr key={sale.id}>
                                                    <td>{sale.invoice_no}</td>
                                                    <td>
                                                        {sale.customer_name ??
                                                            'Walk-in'}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge bg-${sale.order_status === 'completed' ? 'success' : sale.order_status === 'cancelled' ? 'danger' : 'warning'}`}
                                                        >
                                                            {sale.order_status}
                                                        </span>
                                                    </td>
                                                    <td>${sale.total_usd}</td>
                                                </tr>
                                            ))}
                                            {sales.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="text-center text-muted"
                                                    >
                                                        No sales today.
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

ReportsDaily.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsDaily;

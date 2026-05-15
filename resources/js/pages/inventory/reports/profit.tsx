import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import ReportsNav from '@/Components/Inventory/ReportsNav';
import Layout from '@/Layouts';

function ReportsProfit() {
    const { from, to, summary, productProfits } = usePage<{
        from: string;
        to: string;
        summary: Record<string, string | number>;
        productProfits: any[];
    }>().props;
    const [fromDate, setFromDate] = useState(from);
    const [toDate, setToDate] = useState(to);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/reports/profit',
            { from: fromDate, to: toDate },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Profit & Loss Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Profit & Loss Report"
                        pageTitle="Reports"
                    />
                    <ReportsNav active="profit" />

                    <Card className="mb-4 border-0 shadow-sm">
                        <Card.Body>
                            <Form
                                onSubmit={submit}
                                className="d-flex flex-wrap gap-2"
                            >
                                <Form.Control
                                    type="date"
                                    value={fromDate}
                                    onChange={(event) =>
                                        setFromDate(event.target.value)
                                    }
                                />
                                <Form.Control
                                    type="date"
                                    value={toDate}
                                    onChange={(event) =>
                                        setToDate(event.target.value)
                                    }
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Filter
                                </button>
                            </Form>
                        </Card.Body>
                    </Card>

                    <Row className="g-3 mb-4">
                        <SummaryCard
                            label="Revenue"
                            value={money(summary.total_revenue)}
                            tone="primary"
                        />
                        <SummaryCard
                            label="COGS"
                            value={money(summary.total_cogs)}
                            tone="warning"
                        />
                        <SummaryCard
                            label="Profit"
                            value={money(summary.total_profit)}
                            tone="success"
                        />
                        <SummaryCard
                            label="Qty Sold"
                            value={String(summary.total_qty_sold)}
                            tone="info"
                        />
                    </Row>

                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-transparent">
                            <h5 className="card-title mb-1">
                                Product profit analysis
                            </h5>
                            <p className="fs-13 mb-0 text-muted">
                                Compare which product variants generate the
                                strongest margin in the selected period.
                            </p>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive className="mb-0 align-middle">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Qty Sold</th>
                                        <th>Revenue</th>
                                        <th>COGS</th>
                                        <th>Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productProfits.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.product_name}</td>
                                            <td>{item.sku}</td>
                                            <td>{item.qty_sold}</td>
                                            <td>{money(item.revenue)}</td>
                                            <td>{money(item.cogs)}</td>
                                            <td
                                                className={
                                                    parseFloat(item.profit) >= 0
                                                        ? 'text-success fw-semibold'
                                                        : 'text-danger fw-semibold'
                                                }
                                            >
                                                {money(item.profit)}
                                            </td>
                                        </tr>
                                    ))}
                                    {productProfits.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-4 text-center text-muted"
                                            >
                                                No data for selected period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        </>
    );
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: string;
}) {
    return (
        <Col md={3}>
            <Card className={`bg-${tone}-subtle h-100 border-0 shadow-sm`}>
                <Card.Body>
                    <p className="mb-1 text-muted">{label}</p>
                    <h5 className="mb-0">{value}</h5>
                </Card.Body>
            </Card>
        </Col>
    );
}

function money(value: string | number): string {
    return `$${Number(value || 0).toFixed(2)}`;
}

ReportsProfit.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsProfit;

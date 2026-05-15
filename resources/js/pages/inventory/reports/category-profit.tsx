import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import ReportsNav from '@/Components/Inventory/ReportsNav';
import Layout from '@/Layouts';

function ReportsCategoryProfit() {
    const { from, to, summary, categoryProfits } = usePage<{
        from: string;
        to: string;
        summary: Record<string, string | number>;
        categoryProfits: any[];
    }>().props;
    const [fromDate, setFromDate] = useState(from);
    const [toDate, setToDate] = useState(to);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/reports/category-profit',
            { from: fromDate, to: toDate },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Category Profit Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Category Profit Report"
                        pageTitle="Reports"
                    />
                    <ReportsNav active="category-profit" />

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
                                Category performance
                            </h5>
                            <p className="fs-13 mb-0 text-muted">
                                Analyze which categories contribute the most
                                revenue and margin.
                            </p>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive className="mb-0 align-middle">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Qty Sold</th>
                                        <th>Revenue</th>
                                        <th>COGS</th>
                                        <th>Profit</th>
                                        <th>Margin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoryProfits.map((item, idx) => {
                                        const margin =
                                            parseFloat(item.revenue) > 0
                                                ? (
                                                      (parseFloat(item.profit) /
                                                          parseFloat(
                                                              item.revenue,
                                                          )) *
                                                      100
                                                  ).toFixed(1)
                                                : '0.0';

                                        return (
                                            <tr key={idx}>
                                                <td className="fw-medium">
                                                    {item.category_name}
                                                </td>
                                                <td>{item.qty_sold}</td>
                                                <td>{money(item.revenue)}</td>
                                                <td>{money(item.cogs)}</td>
                                                <td
                                                    className={
                                                        parseFloat(
                                                            item.profit,
                                                        ) >= 0
                                                            ? 'text-success fw-semibold'
                                                            : 'text-danger fw-semibold'
                                                    }
                                                >
                                                    {money(item.profit)}
                                                </td>
                                                <td>{margin}%</td>
                                            </tr>
                                        );
                                    })}
                                    {categoryProfits.length === 0 && (
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

ReportsCategoryProfit.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsCategoryProfit;

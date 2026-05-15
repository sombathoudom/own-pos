import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import ReportsNav from '@/Components/Inventory/ReportsNav';
import Layout from '@/Layouts';
import monthlyRoutes from '@/routes/reports/monthly';

function ReportsMonthly() {
    const {
        month,
        summary,
        top_selling,
        daily_ledger,
        expense_breakdown,
        purchase_breakdown,
        source_breakdown,
    } = usePage<{
        month: string;
        summary: Record<string, string | number>;
        top_selling: any[];
        daily_ledger: any[];
        expense_breakdown: any[];
        purchase_breakdown: any[];
        source_breakdown: any[];
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
            <Head title="Monthly Sales Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Monthly Sales Report"
                        pageTitle="Reports"
                    />
                    <ReportsNav active="monthly" />

                    <Card className="mb-4 border-0 shadow-sm">
                        <Card.Body>
                            <Row className="align-items-center g-3">
                                <Col lg={8}>
                                    <h4 className="mb-1">
                                        Monthly analysis for {month}
                                    </h4>
                                    <p className="mb-0 text-muted">
                                        Review daily profit movement, monthly
                                        expenses, stock investment, and
                                        top-selling products in one management
                                        report.
                                    </p>
                                </Col>
                                <Col lg={4}>
                                    <Form
                                        onSubmit={submit}
                                        className="d-flex gap-2"
                                    >
                                        <Form.Control
                                            type="month"
                                            value={selectedMonth}
                                            onChange={(event) =>
                                                setSelectedMonth(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                        >
                                            View
                                        </button>
                                        <a
                                            href={monthlyRoutes.export.url({
                                                query: { month: selectedMonth },
                                            })}
                                            className="btn btn-light border"
                                        >
                                            Export
                                        </a>
                                    </Form>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    <Row className="g-3 mb-4">
                        <SummaryCard
                            label="Total Revenue"
                            value={money(summary.total_revenue)}
                            note="Sales receipts minus refunds"
                            tone="primary"
                            icon="ri-bar-chart-line"
                        />
                        <SummaryCard
                            label="Total COGS"
                            value={money(summary.total_cogs)}
                            note="Product cost for sold items"
                            tone="warning"
                            icon="ri-archive-stack-line"
                        />
                        <SummaryCard
                            label="Gross Profit"
                            value={money(summary.gross_profit)}
                            note="Before operating expenses"
                            tone="info"
                            icon="ri-funds-line"
                        />
                        <SummaryCard
                            label="Expenses"
                            value={money(summary.total_expenses)}
                            note="Boost, salary, plastic, and more"
                            tone="danger"
                            icon="ri-megaphone-line"
                        />
                        <SummaryCard
                            label="Net Profit"
                            value={money(summary.net_profit)}
                            note="Final monthly result"
                            tone="success"
                            icon="ri-line-chart-line"
                        />
                        <SummaryCard
                            label="Qty Sold"
                            value={String(summary.total_qty_sold)}
                            note={`${percent(summary.return_rate)} return rate · ${percent(summary.cancel_rate)} cancel rate`}
                            tone="secondary"
                            icon="ri-shopping-bag-3-line"
                        />
                    </Row>

                    <Row className="g-4 mb-4">
                        <Col xl={8}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-transparent">
                                    <h5 className="card-title mb-1">
                                        Daily profit ledger
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        This follows the idea of your Excel
                                        monthly sheet: one line per day with
                                        revenue, gross profit, expenses, and
                                        final net profit.
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    <Table
                                        responsive
                                        className="mb-0 align-middle"
                                    >
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Orders</th>
                                                <th>Qty</th>
                                                <th>Revenue</th>
                                                <th>Gross Profit</th>
                                                <th>Expense</th>
                                                <th>Net Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {daily_ledger.map((item) => (
                                                <tr key={item.date}>
                                                    <td>{item.date}</td>
                                                    <td>{item.orders}</td>
                                                    <td>{item.qty_sold}</td>
                                                    <td>
                                                        {money(
                                                            item.revenue_usd,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {money(
                                                            item.gross_profit_usd,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {money(
                                                            item.expense_usd,
                                                        )}
                                                    </td>
                                                    <td
                                                        className={
                                                            Number(
                                                                item.net_profit_usd,
                                                            ) >= 0
                                                                ? 'text-success fw-semibold'
                                                                : 'text-danger fw-semibold'
                                                        }
                                                    >
                                                        {money(
                                                            item.net_profit_usd,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {daily_ledger.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No monthly sales data
                                                        found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xl={4}>
                            <Card className="mb-4 border-0 shadow-sm">
                                <Card.Header className="bg-transparent">
                                    <h5 className="card-title mb-1">
                                        Expense summary
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        Understand where monthly operating cost
                                        goes.
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    <Table
                                        responsive
                                        className="mb-0 align-middle"
                                    >
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>Count</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expense_breakdown.map((item) => (
                                                <tr key={item.category}>
                                                    <td>{item.category}</td>
                                                    <td>{item.count}</td>
                                                    <td>
                                                        {money(item.amount_usd)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {expense_breakdown.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="py-3 text-center text-muted"
                                                    >
                                                        No expenses found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>

                            <Card className="mb-4 border-0 shadow-sm">
                                <Card.Header className="bg-transparent">
                                    <h5 className="card-title mb-1">
                                        Source page summary
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        Monthly performance by `DL`, `DC`,
                                        walk-in, and other sources.
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    <Table
                                        responsive
                                        className="mb-0 align-middle"
                                    >
                                        <thead>
                                            <tr>
                                                <th>Source</th>
                                                <th>Orders</th>
                                                <th>Qty</th>
                                                <th>Revenue</th>
                                                <th>Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {source_breakdown.map((item) => (
                                                <tr key={item.source_page}>
                                                    <td>{item.source_page}</td>
                                                    <td>{item.orders}</td>
                                                    <td>{item.qty_sold}</td>
                                                    <td>
                                                        {money(
                                                            item.revenue_usd,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {money(item.profit_usd)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {source_breakdown.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="py-3 text-center text-muted"
                                                    >
                                                        No source page data
                                                        found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-transparent">
                                    <h5 className="card-title mb-1">
                                        Top selling products
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        Best movers this month by delivered
                                        quantity.
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    <Table
                                        responsive
                                        className="mb-0 align-middle"
                                    >
                                        <thead>
                                            <tr>
                                                <th>Variant</th>
                                                <th>Qty</th>
                                                <th>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {top_selling.map((item, index) => (
                                                <tr
                                                    key={`${item.variant_id}-${index}`}
                                                >
                                                    <td>{item.variant_id}</td>
                                                    <td>{item.qty}</td>
                                                    <td>
                                                        {money(item.revenue)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {top_selling.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="py-3 text-center text-muted"
                                                    >
                                                        No top sellers yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row className="g-4">
                        <Col xs={12}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-transparent">
                                    <h5 className="card-title mb-1">
                                        Stock purchase / investment
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        Match monthly stock investment against
                                        sales performance.
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    <Table
                                        responsive
                                        className="mb-0 align-middle"
                                    >
                                        <thead>
                                            <tr>
                                                <th>Purchase No</th>
                                                <th>Purchase Date</th>
                                                <th>Arrival Date</th>
                                                <th>Supplier</th>
                                                <th>Status</th>
                                                <th>Total Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchase_breakdown.map((item) => (
                                                <tr key={item.purchase_no}>
                                                    <td>{item.purchase_no}</td>
                                                    <td>
                                                        {item.purchase_date ||
                                                            '-'}
                                                    </td>
                                                    <td>
                                                        {item.arrival_date ||
                                                            '-'}
                                                    </td>
                                                    <td>
                                                        {item.supplier_name ||
                                                            '-'}
                                                    </td>
                                                    <td className="text-capitalize">
                                                        {item.status}
                                                    </td>
                                                    <td>
                                                        {money(
                                                            item.total_cost_usd,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {purchase_breakdown.length ===
                                                0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No purchases found for
                                                        this month.
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

function SummaryCard({
    label,
    value,
    note,
    tone,
    icon,
}: {
    label: string;
    value: string;
    note: string;
    tone: string;
    icon: string;
}) {
    return (
        <Col xl={4} md={6}>
            <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="d-flex align-items-start gap-3">
                    <div
                        className={`avatar-sm bg-${tone} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                    >
                        <i className={`${icon} text-${tone} fs-4`} />
                    </div>
                    <div>
                        <p className="mb-1 text-muted">{label}</p>
                        <h5 className="mb-1">{value}</h5>
                        <p className="fs-12 mb-0 text-muted">{note}</p>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );
}

function money(value: string | number): string {
    return `$${Number(value || 0).toFixed(2)}`;
}

function percent(value: string | number): string {
    return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

ReportsMonthly.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsMonthly;

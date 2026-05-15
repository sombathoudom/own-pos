import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Badge, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import ReportsNav from '@/Components/Inventory/ReportsNav';
import Layout from '@/Layouts';
import dailyRoutes from '@/routes/reports/daily';

function ReportsDaily() {
    const {
        date,
        entries,
        closings,
        summary,
        expense_breakdown,
        courier_breakdown,
        source_breakdown,
    } = usePage<{
        date: string;
        entries: any[];
        closings: any[];
        summary: Record<string, string | number>;
        expense_breakdown: any[];
        courier_breakdown: any[];
        source_breakdown: any[];
    }>().props;

    const [selectedDate, setSelectedDate] = useState(date);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/reports/daily',
            { date: selectedDate },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Daily Sales Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Daily Sales Report"
                        pageTitle="Reports"
                    />
                    <ReportsNav active="daily" />

                    <Card className="mb-4 border-0 shadow-sm">
                        <Card.Body>
                            <Row className="align-items-center g-3">
                                <Col lg={8}>
                                    <h4 className="mb-1">
                                        Daily business report for {date}
                                    </h4>
                                    <p className="mb-0 text-muted">
                                        Follow sales, cost, delivery, courier
                                        activity, expenses, and final net profit
                                        in one daily view.
                                    </p>
                                </Col>
                                <Col lg={4}>
                                    <Form
                                        onSubmit={submit}
                                        className="d-flex gap-2"
                                    >
                                        <Form.Control
                                            type="date"
                                            value={selectedDate}
                                            onChange={(event) =>
                                                setSelectedDate(
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
                                            href={dailyRoutes.export.url({
                                                query: { date: selectedDate },
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
                            label="Orders"
                            value={String(summary.orders_count)}
                            note={`${summary.qty_sold} pcs sold`}
                            tone="primary"
                            icon="ri-shopping-bag-3-line"
                        />
                        <SummaryCard
                            label="Product Sales"
                            value={money(summary.product_total_usd)}
                            note="Products only"
                            tone="info"
                            icon="ri-t-shirt-2-line"
                        />
                        <SummaryCard
                            label="Price Pack"
                            value={money(summary.price_pack_usd)}
                            note="Customer receipt total"
                            tone="success"
                            icon="ri-wallet-3-line"
                        />
                        <SummaryCard
                            label="Cost Product"
                            value={money(summary.product_cogs_usd)}
                            note="COGS for sold items"
                            tone="warning"
                            icon="ri-archive-stack-line"
                        />
                        <SummaryCard
                            label="Delivery Cost"
                            value={money(summary.delivery_cost_usd)}
                            note="Actual shipping cost"
                            tone="secondary"
                            icon="ri-truck-line"
                        />
                        <SummaryCard
                            label="Gross Profit"
                            value={money(summary.gross_profit_usd)}
                            note={`Day status: ${closings.length > 0 ? 'Closed' : 'Open'}`}
                            tone="dark"
                            icon="ri-line-chart-line"
                        />
                        <SummaryCard
                            label="Boost / Expenses"
                            value={money(summary.boost_expense_usd)}
                            note="Daily operating cost"
                            tone="danger"
                            icon="ri-megaphone-line"
                        />
                        <SummaryCard
                            label="Net Profit"
                            value={money(summary.net_profit_usd)}
                            note="Gross profit minus expenses"
                            tone="success"
                            icon="ri-funds-box-line"
                        />
                    </Row>

                    <Row className="g-4">
                        <Col xl={8}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-transparent">
                                    <h5 className="card-title mb-1">
                                        Daily order details
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        Similar to your spreadsheet: customer,
                                        quantities, product value, cost,
                                        delivery, packed total, profit, and
                                        courier.
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    <Table
                                        responsive
                                        className="mb-0 align-middle"
                                    >
                                        <thead>
                                            <tr>
                                                <th>Reference</th>
                                                <th>Customer</th>
                                                <th>Source</th>
                                                <th>Type</th>
                                                <th>Qty</th>
                                                <th>Price Mix</th>
                                                <th>Total Product</th>
                                                <th>Cost Pro</th>
                                                <th>Delivery</th>
                                                <th>Price Pack</th>
                                                <th>Profit</th>
                                                <th>Other</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entries.map((entry) => (
                                                <tr key={entry.id}>
                                                    <td>
                                                        <div className="fw-semibold">
                                                            {entry.invoice_no}
                                                        </div>
                                                        <div className="fs-12 text-muted">
                                                            {entry.receipt_date}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {entry.customer_name}
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg="light"
                                                            text="dark"
                                                        >
                                                            {entry.source_page ||
                                                                'Other'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg={badgeTone(
                                                                entry.entry_type,
                                                            )}
                                                        >
                                                            {entry.entry_type}
                                                        </Badge>
                                                    </td>
                                                    <td>{entry.qty_sold}</td>
                                                    <td className="fs-12 text-muted">
                                                        {entry.price_mix || '-'}
                                                    </td>
                                                    <td>
                                                        {money(
                                                            entry.product_total_usd,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {money(
                                                            entry.product_cogs_usd,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {money(
                                                            entry.delivery_cost_usd,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {money(
                                                            entry.price_pack_usd,
                                                        )}
                                                    </td>
                                                    <td
                                                        className={
                                                            Number(
                                                                entry.profit_usd,
                                                            ) >= 0
                                                                ? 'text-success fw-semibold'
                                                                : 'text-danger fw-semibold'
                                                        }
                                                    >
                                                        {money(
                                                            entry.profit_usd,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {entry.delivery_company ||
                                                            '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {entries.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={12}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No sales activity found
                                                        for this day.
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
                                        Expense breakdown
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        Use this to track boost and other daily
                                        operating costs.
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    <Table
                                        responsive
                                        className="mb-0 align-middle"
                                    >
                                        <thead>
                                            <tr>
                                                <th>Category</th>
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
                                                        No expenses recorded.
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
                                        Source page breakdown
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        Compare `DL`, `DC`, walk-in, and other
                                        sources like your sheet.
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
                                                        recorded.
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
                                        Courier breakdown
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        Compare courier activity and delivery
                                        impact.
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    <Table
                                        responsive
                                        className="mb-0 align-middle"
                                    >
                                        <thead>
                                            <tr>
                                                <th>Courier</th>
                                                <th>Orders</th>
                                                <th>Delivery</th>
                                                <th>Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {courier_breakdown.map((item) => (
                                                <tr key={item.company}>
                                                    <td>{item.company}</td>
                                                    <td>{item.orders}</td>
                                                    <td>
                                                        {money(
                                                            item.delivery_cost_usd,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {money(item.profit_usd)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {courier_breakdown.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="py-3 text-center text-muted"
                                                    >
                                                        No courier data
                                                        recorded.
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
        <Col xl={3} md={6}>
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

function badgeTone(type: string): string {
    if (type === 'exchange') {
        return 'primary';
    }

    if (type === 'return') {
        return 'danger';
    }

    return 'success';
}

ReportsDaily.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsDaily;

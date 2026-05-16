import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Badge, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import ReportsNav from '@/Components/Inventory/ReportsNav';
import Layout from '@/Layouts';
import dailyRoutes from '@/routes/reports/daily';

type Entry = {
    id: string;
    invoice_no: string;
    customer_name: string;
    entry_type: 'sale' | 'exchange' | 'return';
    order_status: string;
    source_page: string | null;
    qty_sold: number;
    price_mix: string;
    product_total_usd: string;
    product_cogs_usd: string;
    delivery_cost_usd: string;
    delivery_company: string | null;
    note: string | null;
    price_pack_usd: string;
    total_usd: string;
    profit_usd: string;
    receipt_date: string;
};

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
        entries: Entry[];
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

    // Totals row
    const totalQty = entries.reduce((s, e) => s + e.qty_sold, 0);
    const totalProductUsd = entries.reduce(
        (s, e) => s + Number(e.product_total_usd),
        0,
    );
    const totalCogs = entries.reduce(
        (s, e) => s + Number(e.product_cogs_usd),
        0,
    );
    const totalDelivery = entries.reduce(
        (s, e) => s + Number(e.delivery_cost_usd),
        0,
    );
    const totalPricePack = entries.reduce(
        (s, e) => s + Number(e.price_pack_usd),
        0,
    );
    const totalProfit = entries.reduce((s, e) => s + Number(e.profit_usd), 0);

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

                    {/* Header */}
                    <Card className="mb-4 border-0 shadow-sm">
                        <Card.Body>
                            <Row className="align-items-center g-3">
                                <Col lg={8}>
                                    <h4 className="mb-1">
                                        Daily business report for {date}
                                    </h4>
                                    <p className="mb-0 text-muted">
                                        Sales, cost, delivery, courier activity,
                                        expenses, and final net profit in one
                                        daily view.
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
                                            onChange={(e) =>
                                                setSelectedDate(e.target.value)
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

                    {/* Summary Cards */}
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
                            note={`Day: ${closings.length > 0 ? 'Closed' : 'Open'}`}
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

                    {/* Main Order Table — spreadsheet style */}
                    <Card className="mb-4 border-0 shadow-sm">
                        <Card.Header className="border-bottom bg-transparent">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="card-title mb-1">
                                        Daily Order Details
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        {entries.length} orders · {totalQty} pcs
                                        sold
                                    </p>
                                </div>
                                <div className="d-flex gap-2">
                                    <Badge bg="success" className="px-3 py-2">
                                        Profit ${totalProfit.toFixed(2)}
                                    </Badge>
                                    <Badge bg="primary" className="px-3 py-2">
                                        Pack ${totalPricePack.toFixed(2)}
                                    </Badge>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table
                                    className="table-sm table-hover mb-0 align-middle"
                                    style={{ fontSize: '0.82rem' }}
                                >
                                    <thead className="table-light">
                                        <tr>
                                            <th
                                                className="px-3 text-center"
                                                style={{ width: 40 }}
                                            >
                                                #
                                            </th>
                                            <th>Customer</th>
                                            <th className="text-center">
                                                Page
                                            </th>
                                            <th className="text-center">
                                                Type
                                            </th>
                                            <th className="text-center">Qty</th>
                                            <th className="text-end">
                                                Amount ($)
                                            </th>
                                            <th className="text-end">
                                                Total Product
                                            </th>
                                            <th className="text-end">
                                                Cost Pro
                                            </th>
                                            <th className="text-end">
                                                Delivery
                                            </th>
                                            <th className="text-end">
                                                Price Pack
                                            </th>
                                            <th className="text-end">Profit</th>
                                            <th>Other</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entries.map((entry, index) => (
                                            <tr
                                                key={entry.id}
                                                className={
                                                    entry.entry_type ===
                                                    'return'
                                                        ? 'table-danger'
                                                        : entry.entry_type ===
                                                            'exchange'
                                                          ? 'table-warning'
                                                          : ''
                                                }
                                            >
                                                {/* # */}
                                                <td className="px-3 text-center text-muted">
                                                    {index + 1}
                                                </td>

                                                {/* Customer */}
                                                <td>
                                                    <div className="fw-semibold">
                                                        {entry.customer_name}
                                                    </div>
                                                    {entry.note && (
                                                        <div
                                                            className="text-muted"
                                                            style={{
                                                                fontSize:
                                                                    '0.72rem',
                                                            }}
                                                        >
                                                            {entry.note}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Page (DL / DC) */}
                                                <td className="text-center">
                                                    <PageBadge
                                                        source={
                                                            entry.source_page
                                                        }
                                                    />
                                                </td>

                                                {/* Type */}
                                                <td className="text-center">
                                                    {entry.entry_type !==
                                                        'sale' && (
                                                        <Badge
                                                            bg={badgeTone(
                                                                entry.entry_type,
                                                            )}
                                                            style={{
                                                                fontSize:
                                                                    '0.7rem',
                                                            }}
                                                        >
                                                            {entry.entry_type}
                                                        </Badge>
                                                    )}
                                                </td>

                                                {/* Qty */}
                                                <td className="fw-semibold text-center">
                                                    {entry.qty_sold > 0
                                                        ? entry.qty_sold
                                                        : ''}
                                                </td>

                                                {/* Amount (price mix) */}
                                                <td className="text-end text-muted">
                                                    {entry.price_mix || '-'}
                                                </td>

                                                {/* Total Product */}
                                                <td className="text-end">
                                                    {money(
                                                        entry.product_total_usd,
                                                    )}
                                                </td>

                                                {/* Cost Pro */}
                                                <td className="text-end text-muted">
                                                    {money(
                                                        entry.product_cogs_usd,
                                                    )}
                                                </td>

                                                {/* Delivery */}
                                                <td className="text-end">
                                                    {Number(
                                                        entry.delivery_cost_usd,
                                                    ) > 0
                                                        ? money(
                                                              entry.delivery_cost_usd,
                                                          )
                                                        : '-'}
                                                </td>

                                                {/* Price Pack */}
                                                <td className="fw-semibold text-end">
                                                    {money(
                                                        entry.price_pack_usd,
                                                    )}
                                                </td>

                                                {/* Profit */}
                                                <td
                                                    className={`fw-bold text-end ${Number(entry.profit_usd) >= 0 ? 'text-success' : 'text-danger'}`}
                                                >
                                                    {money(entry.profit_usd)}
                                                </td>

                                                {/* Other (courier) */}
                                                <td>
                                                    {entry.delivery_company ? (
                                                        <Badge
                                                            bg="light"
                                                            text="dark"
                                                            style={{
                                                                fontSize:
                                                                    '0.7rem',
                                                            }}
                                                        >
                                                            {
                                                                entry.delivery_company
                                                            }
                                                        </Badge>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        ))}

                                        {entries.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={12}
                                                    className="py-5 text-center text-muted"
                                                >
                                                    <i className="ri-file-list-3-line fs-2 d-block mb-2 opacity-25"></i>
                                                    No sales activity found for
                                                    this day.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>

                                    {/* Totals row */}
                                    {entries.length > 0 && (
                                        <tfoot className="table-secondary fw-bold">
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-3 text-end"
                                                >
                                                    Total
                                                </td>
                                                <td className="text-center">
                                                    {totalQty}
                                                </td>
                                                <td></td>
                                                <td className="text-end">
                                                    $
                                                    {totalProductUsd.toFixed(2)}
                                                </td>
                                                <td className="text-end text-muted">
                                                    ${totalCogs.toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                    ${totalDelivery.toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                    ${totalPricePack.toFixed(2)}
                                                </td>
                                                <td
                                                    className={`text-end ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}
                                                >
                                                    ${totalProfit.toFixed(2)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Bottom breakdowns */}
                    <Row className="g-4">
                        {/* Source breakdown */}
                        <Col xl={4}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-transparent">
                                    <h5 className="card-title mb-1">
                                        Page Breakdown
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        DL, DC, Walk-in and other sources
                                    </p>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <Table
                                        responsive
                                        className="table-sm mb-0 align-middle"
                                        style={{ fontSize: '0.82rem' }}
                                    >
                                        <thead className="table-light">
                                            <tr>
                                                <th className="px-3">Page</th>
                                                <th className="text-center">
                                                    Orders
                                                </th>
                                                <th className="text-center">
                                                    Qty
                                                </th>
                                                <th className="text-end">
                                                    Revenue
                                                </th>
                                                <th className="px-3 text-end">
                                                    Profit
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {source_breakdown.map((item) => (
                                                <tr key={item.source_page}>
                                                    <td className="fw-semibold px-3">
                                                        {item.source_page}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.orders}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.qty_sold}
                                                    </td>
                                                    <td className="text-end">
                                                        {money(
                                                            item.revenue_usd,
                                                        )}
                                                    </td>
                                                    <td className="text-success fw-semibold px-3 text-end">
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
                                                        No data.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Courier breakdown */}
                        <Col xl={4}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-transparent">
                                    <h5 className="card-title mb-1">
                                        Courier Breakdown
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        JS, Vet, J&T, KL and others
                                    </p>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <Table
                                        responsive
                                        className="table-sm mb-0 align-middle"
                                        style={{ fontSize: '0.82rem' }}
                                    >
                                        <thead className="table-light">
                                            <tr>
                                                <th className="px-3">
                                                    Courier
                                                </th>
                                                <th className="text-center">
                                                    Orders
                                                </th>
                                                <th className="text-center">
                                                    Packs
                                                </th>
                                                <th className="text-end">
                                                    Total
                                                </th>
                                                <th className="text-end">
                                                    Delivery
                                                </th>
                                                <th className="px-3 text-end">
                                                    Profit
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {courier_breakdown.map((item) => (
                                                <tr key={item.company}>
                                                    <td className="fw-semibold px-3">
                                                        {item.company}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.orders}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.qty_sold}
                                                    </td>
                                                    <td className="text-end">
                                                        {money(
                                                            item.revenue_usd,
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        {money(
                                                            item.delivery_cost_usd,
                                                        )}
                                                    </td>
                                                    <td className="text-success fw-semibold px-3 text-end">
                                                        {money(item.profit_usd)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {courier_breakdown.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="py-3 text-center text-muted"
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

                        {/* Expense breakdown */}
                        <Col xl={4}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-transparent">
                                    <h5 className="card-title mb-1">
                                        Expense Breakdown
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        Boost and other daily operating costs
                                    </p>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <Table
                                        responsive
                                        className="table-sm mb-0 align-middle"
                                        style={{ fontSize: '0.82rem' }}
                                    >
                                        <thead className="table-light">
                                            <tr>
                                                <th className="px-3">
                                                    Category
                                                </th>
                                                <th className="text-center">
                                                    Count
                                                </th>
                                                <th className="px-3 text-end">
                                                    Amount
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expense_breakdown.map((item) => (
                                                <tr key={item.category}>
                                                    <td className="fw-semibold px-3">
                                                        {item.category}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.count}
                                                    </td>
                                                    <td className="text-danger fw-semibold px-3 text-end">
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
                                        {expense_breakdown.length > 0 && (
                                            <tfoot className="table-secondary fw-bold">
                                                <tr>
                                                    <td
                                                        colSpan={2}
                                                        className="px-3"
                                                    >
                                                        Total
                                                    </td>
                                                    <td className="text-danger px-3 text-end">
                                                        $
                                                        {expense_breakdown
                                                            .reduce(
                                                                (s, i) =>
                                                                    s +
                                                                    Number(
                                                                        i.amount_usd,
                                                                    ),
                                                                0,
                                                            )
                                                            .toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
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

/** Shows DL / DC badge or source name */
function PageBadge({ source }: { source: string | null }) {
    if (!source) {
        return <span className="text-muted">-</span>;
    }

    const upper = source.toUpperCase();

    if (upper === 'DL' || upper.includes('DL')) {
        return (
            <Badge bg="primary" style={{ fontSize: '0.7rem' }}>
                DL
            </Badge>
        );
    }

    if (upper === 'DC' || upper.includes('DC')) {
        return (
            <Badge bg="info" style={{ fontSize: '0.7rem' }}>
                DC
            </Badge>
        );
    }

    return (
        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            {source}
        </span>
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
    const n = Number(value || 0);
    return n === 0 ? '-' : `$${n.toFixed(2)}`;
}

function badgeTone(type: string): string {
    if (type === 'exchange') {
        return 'warning';
    }

    if (type === 'return') {
        return 'danger';
    }

    return 'success';
}

ReportsDaily.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsDaily;

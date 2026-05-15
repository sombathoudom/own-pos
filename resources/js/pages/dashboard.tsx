import { Head, Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    Badge,
    Card,
    Col,
    Container,
    ListGroup,
    ProgressBar,
    Row,
    Table,
} from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { index as lowStockIndex } from '@/routes/low-stock';
import {
    daily as reportsDaily,
    monthly as reportsMonthly,
} from '@/routes/reports';
import { index as salesIndex, show as salesShow } from '@/routes/sales';
import { index as stockIndex } from '@/routes/stock';
import type {
    DashboardLowStockItem,
    DashboardPageProps,
    DashboardPaymentBreakdown,
    DashboardRecentSale,
    DashboardSalesTrendPoint,
    DashboardTopProduct,
} from '@/types';

function Dashboard() {
    const {
        summary,
        sales_trend: salesTrend,
        payment_breakdown: paymentBreakdown,
        top_products: topProducts,
        recent_sales: recentSales,
        low_stock_watchlist: lowStockWatchlist,
    } = usePage<DashboardPageProps>().props;

    const totalPaymentRecords = paymentBreakdown.reduce(
        (sum, item) => sum + item.total,
        0,
    );

    const summaryCards = [
        {
            label: 'Daily Sales',
            value: money(summary.today_sales_usd),
            note: `${summary.today_orders} paid orders today`,
            icon: 'ri-sun-line',
            tone: 'primary',
        },
        {
            label: 'Monthly Sales',
            value: money(summary.month_sales_usd),
            note: 'Current month net revenue',
            icon: 'ri-calendar-event-line',
            tone: 'success',
        },
        {
            label: 'Total Sales',
            value: money(summary.total_sales_usd),
            note: 'All-time net revenue',
            icon: 'ri-line-chart-line',
            tone: 'info',
        },
        {
            label: 'Outstanding Due',
            value: money(summary.outstanding_usd),
            note: 'Unpaid and partial balances',
            icon: 'ri-wallet-3-line',
            tone: 'warning',
        },
        {
            label: 'Today Expenses',
            value: money(summary.today_expenses_usd),
            note: 'Operating costs recorded today',
            icon: 'ri-money-dollar-circle-line',
            tone: 'danger',
        },
        {
            label: 'Low Stock Items',
            value: String(summary.low_stock_items),
            note: `${summary.today_closing_status} for today's closing`,
            icon: 'ri-alarm-warning-line',
            tone: 'secondary',
        },
    ];

    return (
        <>
            <Head title="Dashboard" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Dashboard" pageTitle="Overview" />

                    <Card className="mb-4 overflow-hidden border-0 shadow-sm">
                        <Card.Body
                            className="p-4"
                            style={{
                                background:
                                    'linear-gradient(135deg, rgba(64,81,137,0.12) 0%, rgba(10,179,156,0.1) 100%)',
                            }}
                        >
                            <Row className="align-items-center g-4">
                                <Col lg={8}>
                                    <div className="d-flex align-items-center mb-3 gap-3">
                                        <div className="avatar-sm rounded-circle bg-opacity-10 d-flex align-items-center justify-content-center bg-primary">
                                            <i className="ri-dashboard-2-line fs-3 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-uppercase fw-semibold fs-12 mb-1 text-muted">
                                                Store command center
                                            </p>
                                            <h3 className="mb-1">
                                                Everything important in one
                                                place
                                            </h3>
                                            <p className="mb-0 text-muted">
                                                Track daily sales, total
                                                revenue, top-performing
                                                products, recent receipts, and
                                                stock risks without leaving the
                                                dashboard.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="d-flex flex-wrap gap-2">
                                        <Link
                                            href={salesIndex.url()}
                                            className="btn btn-primary"
                                        >
                                            <i className="ri-shopping-cart-2-line me-1" />
                                            View Sales
                                        </Link>
                                        <Link
                                            href={reportsDaily.url()}
                                            className="btn btn-outline-primary"
                                        >
                                            <i className="ri-bar-chart-box-line me-1" />
                                            Daily Report
                                        </Link>
                                        <Link
                                            href={stockIndex.url()}
                                            className="btn btn-outline-dark"
                                        >
                                            <i className="ri-inbox-archive-line me-1" />
                                            Stock Balances
                                        </Link>
                                    </div>
                                </Col>

                                <Col lg={4}>
                                    <Card className="h-100 border-0 shadow-sm">
                                        <Card.Body>
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <h5 className="mb-0">
                                                    Today Snapshot
                                                </h5>
                                                <Badge bg="light" text="dark">
                                                    {
                                                        summary.today_closing_status
                                                    }
                                                </Badge>
                                            </div>
                                            <div className="vstack gap-3">
                                                <div>
                                                    <p className="mb-1 text-muted">
                                                        Sales received
                                                    </p>
                                                    <h3 className="mb-0">
                                                        {money(
                                                            summary.today_sales_usd,
                                                        )}
                                                    </h3>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted">
                                                        Paid orders
                                                    </span>
                                                    <span className="fw-semibold">
                                                        {summary.today_orders}
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted">
                                                        Expenses
                                                    </span>
                                                    <span className="fw-semibold text-danger">
                                                        {money(
                                                            summary.today_expenses_usd,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted">
                                                        Stock alerts
                                                    </span>
                                                    <span className="fw-semibold text-warning">
                                                        {
                                                            summary.low_stock_items
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    <Row className="g-3 mb-4">
                        {summaryCards.map((card) => (
                            <Col xl={4} md={6} key={card.label}>
                                <Card className="h-100 border-0 shadow-sm">
                                    <Card.Body className="d-flex align-items-start gap-3">
                                        <div
                                            className={`avatar-sm bg-${card.tone} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}
                                        >
                                            <i
                                                className={`${card.icon} text-${card.tone} fs-4`}
                                            />
                                        </div>
                                        <div className="flex-grow-1">
                                            <p className="mb-1 text-muted">
                                                {card.label}
                                            </p>
                                            <h4 className="mb-1">
                                                {card.value}
                                            </h4>
                                            <p className="fs-13 mb-0 text-muted">
                                                {card.note}
                                            </p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <Row className="g-4 mb-4">
                        <Col xxl={8}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="d-flex align-items-center justify-content-between bg-transparent">
                                    <div>
                                        <h5 className="card-title mb-1">
                                            7-Day Sales Trend
                                        </h5>
                                        <p className="fs-13 mb-0 text-muted">
                                            Quick visual read of revenue,
                                            expenses, and paid orders over the
                                            last seven days.
                                        </p>
                                    </div>
                                    <Badge bg="light" text="dark">
                                        Last 7 days
                                    </Badge>
                                </Card.Header>
                                <Card.Body>
                                    <DashboardTrendChart points={salesTrend} />
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xxl={4}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-transparent">
                                    <h5 className="card-title mb-1">
                                        Payment Snapshot
                                    </h5>
                                    <p className="fs-13 mb-0 text-muted">
                                        Fast view of collection status across
                                        sales.
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    <div className="vstack mb-4 gap-3">
                                        {paymentBreakdown.map((item) => (
                                            <PaymentBreakdownRow
                                                key={item.status}
                                                item={item}
                                                total={totalPaymentRecords}
                                            />
                                        ))}
                                    </div>

                                    <div className="rounded-3 bg-light p-3">
                                        <p className="mb-2 text-muted">
                                            Quick access
                                        </p>
                                        <div className="d-grid gap-2">
                                            <Link
                                                href={reportsMonthly.url()}
                                                className="btn btn-light border"
                                            >
                                                <i className="ri-pie-chart-line me-1" />
                                                Monthly report
                                            </Link>
                                            <Link
                                                href={lowStockIndex.url()}
                                                className="btn btn-light border"
                                            >
                                                <i className="ri-alert-line me-1" />
                                                Low stock alerts
                                            </Link>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row className="g-4 mb-4">
                        <Col xxl={8}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="d-flex align-items-center justify-content-between bg-transparent">
                                    <div>
                                        <h5 className="card-title mb-1">
                                            Top Products
                                        </h5>
                                        <p className="fs-13 mb-0 text-muted">
                                            Best-performing items based on
                                            delivered quantity.
                                        </p>
                                    </div>
                                    <Link
                                        href={salesIndex.url()}
                                        className="btn btn-sm btn-outline-primary"
                                    >
                                        Sales list
                                    </Link>
                                </Card.Header>
                                <Card.Body>
                                    <Table
                                        responsive
                                        className="mb-0 align-middle"
                                    >
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>SKU</th>
                                                <th>Qty Sold</th>
                                                <th>Revenue</th>
                                                <th>Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topProducts.map((product) => (
                                                <TopProductRow
                                                    key={product.variant_id}
                                                    product={product}
                                                />
                                            ))}
                                            {topProducts.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No product sales yet.
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
                        <Col xl={8}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="d-flex align-items-center justify-content-between bg-transparent">
                                    <div>
                                        <h5 className="card-title mb-1">
                                            Recent Sales Receipts
                                        </h5>
                                        <p className="fs-13 mb-0 text-muted">
                                            Latest customer receipts based on
                                            actual money received date.
                                        </p>
                                    </div>
                                    <Link
                                        href={salesIndex.url()}
                                        className="btn btn-sm btn-outline-primary"
                                    >
                                        All sales
                                    </Link>
                                </Card.Header>
                                <Card.Body>
                                    <Table
                                        responsive
                                        className="mb-0 align-middle"
                                    >
                                        <thead>
                                            <tr>
                                                <th>Invoice</th>
                                                <th>Customer</th>
                                                <th>Receipt Date</th>
                                                <th>Total</th>
                                                <th>Payment</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentSales.map((sale) => (
                                                <RecentSaleRow
                                                    key={sale.id}
                                                    sale={sale}
                                                />
                                            ))}
                                            {recentSales.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No receipts recorded
                                                        yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xl={4}>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="d-flex align-items-center justify-content-between bg-transparent">
                                    <div>
                                        <h5 className="card-title mb-1">
                                            Low Stock Watchlist
                                        </h5>
                                        <p className="fs-13 mb-0 text-muted">
                                            Refill these items soon to avoid
                                            missed sales.
                                        </p>
                                    </div>
                                    <Link
                                        href={lowStockIndex.url()}
                                        className="btn btn-sm btn-outline-warning"
                                    >
                                        View all
                                    </Link>
                                </Card.Header>
                                <Card.Body>
                                    <ListGroup variant="flush">
                                        {lowStockWatchlist.map((item) => (
                                            <LowStockRow
                                                key={item.variant_id}
                                                item={item}
                                            />
                                        ))}
                                        {lowStockWatchlist.length === 0 && (
                                            <div className="py-4 text-center text-muted">
                                                No low stock items right now.
                                            </div>
                                        )}
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

function TopProductRow({ product }: { product: DashboardTopProduct }) {
    return (
        <tr>
            <td>
                <div className="fw-semibold">
                    {product.product_name ?? 'Unknown product'}
                </div>
                <div className="fs-12 text-muted">
                    {[product.color, product.size]
                        .filter(Boolean)
                        .join(' / ') || 'Variant'}
                </div>
            </td>
            <td className="text-muted">{product.sku ?? '-'}</td>
            <td>{product.qty_sold}</td>
            <td>{money(product.revenue_usd)}</td>
            <td>
                <Badge
                    bg={
                        product.stock_on_hand <= 0
                            ? 'danger'
                            : product.stock_on_hand <= 5
                              ? 'warning'
                              : 'success'
                    }
                >
                    {product.stock_on_hand}
                </Badge>
            </td>
        </tr>
    );
}

function DashboardTrendChart({
    points,
}: {
    points: DashboardSalesTrendPoint[];
}) {
    const chartWidth = 640;
    const chartHeight = 220;
    const padding = 24;
    const salesValues = points.map((point) => Number(point.sales_usd));
    const expenseValues = points.map((point) => Number(point.expenses_usd));
    const maxValue = Math.max(1, ...salesValues, ...expenseValues);

    const buildLine = (values: number[]) => {
        return values
            .map((value, index) => {
                const x =
                    padding +
                    (index * (chartWidth - padding * 2)) /
                        Math.max(1, values.length - 1);
                const y =
                    chartHeight -
                    padding -
                    (value / maxValue) * (chartHeight - padding * 2);

                return `${x},${y}`;
            })
            .join(' ');
    };

    return (
        <>
            <div className="d-flex mb-3 flex-wrap gap-3">
                <span className="small text-muted">
                    <i className="ri-checkbox-blank-circle-fill me-1 text-primary" />
                    Sales
                </span>
                <span className="small text-muted">
                    <i className="ri-checkbox-blank-circle-fill text-danger me-1" />
                    Expenses
                </span>
            </div>

            <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-100"
                role="img"
                aria-label="Seven day sales trend chart"
            >
                {[0, 1, 2, 3].map((step) => {
                    const y =
                        padding + (step * (chartHeight - padding * 2)) / 3;

                    return (
                        <line
                            key={step}
                            x1={padding}
                            y1={y}
                            x2={chartWidth - padding}
                            y2={y}
                            stroke="rgba(116, 120, 141, 0.18)"
                            strokeDasharray="4 4"
                        />
                    );
                })}

                <polyline
                    fill="none"
                    stroke="rgba(64, 81, 137, 1)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={buildLine(salesValues)}
                />

                <polyline
                    fill="none"
                    stroke="rgba(240, 101, 72, 1)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={buildLine(expenseValues)}
                />

                {points.map((point, index) => {
                    const x =
                        padding +
                        (index * (chartWidth - padding * 2)) /
                            Math.max(1, points.length - 1);
                    const salesY =
                        chartHeight -
                        padding -
                        (Number(point.sales_usd) / maxValue) *
                            (chartHeight - padding * 2);

                    return (
                        <g key={point.date}>
                            <circle
                                cx={x}
                                cy={salesY}
                                r="5"
                                fill="rgba(64, 81, 137, 1)"
                            />
                            <text
                                x={x}
                                y={chartHeight - 4}
                                textAnchor="middle"
                                fontSize="11"
                                fill="rgba(116, 120, 141, 1)"
                            >
                                {point.label}
                            </text>
                        </g>
                    );
                })}
            </svg>

            <Row className="g-3 mt-2">
                {points.map((point) => (
                    <Col md={6} xl={3} key={point.date}>
                        <div className="rounded-3 h-100 border p-3">
                            <div className="small mb-1 text-muted">
                                {point.label}
                            </div>
                            <div className="fw-semibold mb-1">
                                {money(point.sales_usd)}
                            </div>
                            <div className="small text-muted">
                                {point.orders} orders ·{' '}
                                {money(point.expenses_usd)} expenses
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>
        </>
    );
}

function PaymentBreakdownRow({
    item,
    total,
}: {
    item: DashboardPaymentBreakdown;
    total: number;
}) {
    const progress = total > 0 ? (item.total / total) * 100 : 0;
    const tone =
        item.status === 'paid'
            ? 'success'
            : item.status === 'partial'
              ? 'warning'
              : 'danger';

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-2">
                <div>
                    <span className="fw-medium text-capitalize">
                        {item.status}
                    </span>
                </div>
                <span className="text-muted">{item.total}</span>
            </div>
            <ProgressBar now={progress} variant={tone} style={{ height: 8 }} />
        </div>
    );
}

function RecentSaleRow({ sale }: { sale: DashboardRecentSale }) {
    return (
        <tr>
            <td>
                <div className="fw-semibold">{sale.invoice_no}</div>
                <div className="fs-12 text-capitalize text-muted">
                    {sale.order_status}
                </div>
            </td>
            <td>{sale.customer_name ?? 'Walk-in'}</td>
            <td>{sale.payment_received_date ?? '-'}</td>
            <td>{money(sale.total_usd)}</td>
            <td>
                <Badge bg={paymentBadgeTone(sale.payment_status)}>
                    {sale.payment_status}
                </Badge>
            </td>
            <td className="text-end">
                <Link
                    href={salesShow.url(sale.id)}
                    className="btn btn-sm btn-light"
                >
                    Open
                </Link>
            </td>
        </tr>
    );
}

function LowStockRow({ item }: { item: DashboardLowStockItem }) {
    return (
        <ListGroup.Item className="d-flex align-items-center justify-content-between px-0">
            <div>
                <div className="fw-semibold">
                    {item.product_name ?? 'Unknown product'}
                </div>
                <div className="fs-12 text-muted">
                    {item.sku ?? '-'}
                    {item.color || item.size
                        ? ` - ${[item.color, item.size].filter(Boolean).join(' / ')}`
                        : ''}
                </div>
            </div>
            <Badge bg={item.qty_on_hand === 0 ? 'danger' : 'warning'}>
                {item.qty_on_hand}
            </Badge>
        </ListGroup.Item>
    );
}

function money(value: string): string {
    return `$${Number(value).toFixed(2)}`;
}

function paymentBadgeTone(status: string): 'success' | 'warning' | 'danger' {
    if (status === 'paid') {
        return 'success';
    }

    if (status === 'partial') {
        return 'warning';
    }

    return 'danger';
}

Dashboard.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default Dashboard;

import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import ReportsNav from '@/Components/Inventory/ReportsNav';
import Layout from '@/Layouts';
import { delivery as deliveryReport } from '@/routes/reports';

type DeliverySummary = {
    delivery_count: number;
    orders: number;
    packs: number;
    total_usd: string;
    delivery_fee_usd: string;
    delivery_cost_usd: string;
    delivery_profit_usd: string;
};

type DeliveryRow = {
    company: string;
    orders: number;
    packs: number;
    total_usd: string;
    delivery_fee_usd: string;
    delivery_cost_usd: string;
    delivery_profit_usd: string;
};

type DeliveryEntry = {
    company: string;
    invoice_no: string;
    customer_name: string;
    source_page: string | null;
    packs: number;
    total_usd: string;
    delivery_fee_usd: string;
    delivery_cost_usd: string;
    delivery_profit_usd: string;
};

function ReportsDelivery() {
    const { date, summary, deliveries, entries } = usePage<{
        date: string;
        summary: DeliverySummary;
        deliveries: DeliveryRow[];
        entries: DeliveryEntry[];
    }>().props;

    const [selectedDate, setSelectedDate] = useState(date);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            deliveryReport.url(),
            { date: selectedDate },
            { preserveScroll: true, preserveState: true },
        );
    };

    const entriesByCompany = useMemo(() => {
        return entries.reduce<Record<string, DeliveryEntry[]>>(
            (grouped, entry) => {
                grouped[entry.company] ??= [];
                grouped[entry.company].push(entry);

                return grouped;
            },
            {},
        );
    }, [entries]);

    return (
        <>
            <Head title="Delivery Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Delivery Report" pageTitle="Reports" />
                    <ReportsNav active="delivery" />

                    <Card className="mb-4 border-0 shadow-sm">
                        <Card.Body>
                            <Row className="align-items-center g-3">
                                <Col lg={8}>
                                    <h4 className="mb-1">
                                        Delivery workload for {date}
                                    </h4>
                                    <p className="mb-0 text-muted">
                                        See how many packs each delivery handler
                                        got today and the total amount assigned
                                        to them.
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
                                    </Form>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    <Row className="g-3 mb-4">
                        <SummaryCard
                            label="Delivery Teams"
                            value={String(summary.delivery_count)}
                            tone="primary"
                        />
                        <SummaryCard
                            label="Orders"
                            value={String(summary.orders)}
                            tone="info"
                        />
                        <SummaryCard
                            label="Packs"
                            value={String(summary.packs)}
                            tone="warning"
                        />
                        <SummaryCard
                            label="Assigned Total"
                            value={money(summary.total_usd)}
                            tone="success"
                        />
                    </Row>

                    <Row className="g-3 mb-4">
                        <SummaryCard
                            label="Delivery Fee"
                            value={money(summary.delivery_fee_usd)}
                            tone="secondary"
                        />
                        <SummaryCard
                            label="Delivery Cost"
                            value={money(summary.delivery_cost_usd)}
                            tone="danger"
                        />
                        <SummaryCard
                            label="Delivery Profit"
                            value={money(summary.delivery_profit_usd)}
                            tone="dark"
                        />
                    </Row>

                    <Card className="mb-4 border-0 shadow-sm">
                        <Card.Header className="bg-transparent">
                            <h5 className="card-title mb-1">
                                Delivery totals by handler
                            </h5>
                            <p className="fs-13 mb-0 text-muted">
                                One line per delivery company for the selected
                                day.
                            </p>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive className="mb-0 align-middle">
                                <thead>
                                    <tr>
                                        <th>Delivery</th>
                                        <th className="text-center">Orders</th>
                                        <th className="text-center">Packs</th>
                                        <th className="text-end">Total</th>
                                        <th className="text-end">Fee</th>
                                        <th className="text-end">Cost</th>
                                        <th className="text-end">Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveries.map((item) => (
                                        <tr key={item.company}>
                                            <td className="fw-semibold">
                                                {item.company}
                                            </td>
                                            <td className="text-center">
                                                {item.orders}
                                            </td>
                                            <td className="text-center">
                                                {item.packs}
                                            </td>
                                            <td className="text-end">
                                                {money(item.total_usd)}
                                            </td>
                                            <td className="text-end">
                                                {money(item.delivery_fee_usd)}
                                            </td>
                                            <td className="text-end">
                                                {money(item.delivery_cost_usd)}
                                            </td>
                                            <td className="text-success fw-semibold text-end">
                                                {money(
                                                    item.delivery_profit_usd,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {deliveries.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-4 text-center text-muted"
                                            >
                                                No delivery assignment found for
                                                this day.
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
                                Delivery order details
                            </h5>
                            <p className="fs-13 mb-0 text-muted">
                                Detail lines grouped by delivery company.
                            </p>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table className="mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-3">Delivery</th>
                                            <th>Invoice</th>
                                            <th>Customer</th>
                                            <th className="text-center">
                                                Page
                                            </th>
                                            <th className="text-center">
                                                Packs
                                            </th>
                                            <th className="text-end">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveries.flatMap((deliveryItem) =>
                                            (
                                                entriesByCompany[
                                                    deliveryItem.company
                                                ] ?? []
                                            ).map((entry, index) => (
                                                <tr
                                                    key={`${entry.company}-${entry.invoice_no}`}
                                                >
                                                    <td className="fw-semibold ps-3">
                                                        {index === 0
                                                            ? entry.company
                                                            : ''}
                                                    </td>
                                                    <td>{entry.invoice_no}</td>
                                                    <td>
                                                        {entry.customer_name}
                                                    </td>
                                                    <td className="text-center">
                                                        {entry.source_page ??
                                                            '-'}
                                                    </td>
                                                    <td className="text-center">
                                                        {entry.packs}
                                                    </td>
                                                    <td className="text-end">
                                                        {money(entry.total_usd)}
                                                    </td>
                                                </tr>
                                            )),
                                        )}
                                        {entries.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="py-4 text-center text-muted"
                                                >
                                                    No delivery detail found for
                                                    this day.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
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
        <Col xl={3} md={6}>
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

ReportsDelivery.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default ReportsDelivery;

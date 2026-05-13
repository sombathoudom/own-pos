import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode } from 'react';
import { Card, Col, Container, Form, Row } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';

function DailyClosingsCreate() {
    const { date, preview } = usePage<{
        date: string;
        preview: Record<string, string | number>;
    }>().props;
    const { data, setData, post, processing } = useForm({
        closing_date: date,
        total_orders: preview.total_orders,
        completed_orders: preview.completed_orders,
        cancelled_orders: preview.cancelled_orders,
        returned_orders: preview.returned_orders,
        total_qty_sold: preview.total_qty_sold,
        gross_sales_usd: preview.gross_sales_usd,
        discount_usd: preview.discount_usd,
        net_sales_usd: preview.net_sales_usd,
        total_cogs_usd: preview.total_cogs_usd,
        gross_profit_usd: preview.gross_profit_usd,
        total_expenses_usd: preview.total_expenses_usd,
        net_profit_usd: preview.net_profit_usd,
        cash_usd: preview.cash_usd,
        cash_khr: preview.cash_khr ?? 0,
        bank_usd: preview.bank_usd ?? 0,
        unpaid_usd: preview.unpaid_usd,
        refund_usd: preview.refund_usd,
        note: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/daily-closings');
    };

    return (
        <>
            <Head title="Daily Closing" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Daily Closing" pageTitle="Inventory" />
                    <Row>
                        <Col lg={8}>
                            <Card>
                                <Card.Body>
                                    <h4 className="card-title mb-3">
                                        Close Day: {date}
                                    </h4>
                                    <Form onSubmit={submit}>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Total Orders
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={
                                                            data.total_orders
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'total_orders',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Completed Orders
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={
                                                            data.completed_orders
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'completed_orders',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Cancelled Orders
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={
                                                            data.cancelled_orders
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'cancelled_orders',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Returned Orders
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={
                                                            data.returned_orders
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'returned_orders',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Total Qty Sold
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={
                                                            data.total_qty_sold
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'total_qty_sold',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Gross Sales (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            data.gross_sales_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'gross_sales_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Discount (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            data.discount_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'discount_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Net Sales (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            data.net_sales_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'net_sales_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Total COGS (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            data.total_cogs_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'total_cogs_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Gross Profit (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            data.gross_profit_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'gross_profit_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Total Expenses (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            data.total_expenses_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'total_expenses_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Net Profit (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            data.net_profit_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'net_profit_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Cash USD
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={data.cash_usd}
                                                        onChange={(e) =>
                                                            setData(
                                                                'cash_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Cash KHR
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="1"
                                                        value={data.cash_khr}
                                                        onChange={(e) =>
                                                            setData(
                                                                'cash_khr',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Bank USD
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={data.bank_usd}
                                                        onChange={(e) =>
                                                            setData(
                                                                'bank_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Unpaid USD
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={data.unpaid_usd}
                                                        onChange={(e) =>
                                                            setData(
                                                                'unpaid_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Refund USD
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        value={data.refund_usd}
                                                        onChange={(e) =>
                                                            setData(
                                                                'refund_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Note
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        value={data.note}
                                                        onChange={(e) =>
                                                            setData(
                                                                'note',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <div className="d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-success"
                                                disabled={processing}
                                            >
                                                Close Day
                                            </button>
                                            <Link
                                                href="/daily-closings"
                                                className="btn btn-light"
                                            >
                                                Cancel
                                            </Link>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

DailyClosingsCreate.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default DailyClosingsCreate;

import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode } from 'react';
import { Card, Col, Container, Form, Row } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';

function SalesDelivery() {
    const { sale } = usePage<{
        sale: {
            id: number;
            invoice_no: string;
            delivery: Record<string, any> | null;
        };
    }>().props;
    const delivery = sale.delivery;

    const { data, setData, post, processing } = useForm({
        delivery_company: delivery?.delivery_company ?? '',
        tracking_no: delivery?.tracking_no ?? '',
        customer_delivery_fee_usd: delivery?.customer_delivery_fee_usd ?? '0',
        actual_delivery_cost_usd: delivery?.actual_delivery_cost_usd ?? '0',
        delivery_status: delivery?.delivery_status ?? 'pending',
        delivered_at: delivery?.delivered_at
            ? delivery.delivered_at.slice(0, 16)
            : '',
        failed_reason: delivery?.failed_reason ?? '',
        note: delivery?.note ?? '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(`/sales/${sale.id}/delivery`);
    };

    return (
        <>
            <Head title={`Delivery - ${sale.invoice_no}`} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title={`Delivery: ${sale.invoice_no}`}
                        pageTitle="Sales"
                    />
                    <Row>
                        <Col lg={6}>
                            <Card>
                                <Card.Body>
                                    <Form onSubmit={submit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Delivery Company
                                            </Form.Label>
                                            <Form.Control
                                                value={data.delivery_company}
                                                onChange={(e) =>
                                                    setData(
                                                        'delivery_company',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tracking No</Form.Label>
                                            <Form.Control
                                                value={data.tracking_no}
                                                onChange={(e) =>
                                                    setData(
                                                        'tracking_no',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Customer Delivery Fee (USD)
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                value={
                                                    data.customer_delivery_fee_usd
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'customer_delivery_fee_usd',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Actual Delivery Cost (USD)
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                value={
                                                    data.actual_delivery_cost_usd
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'actual_delivery_cost_usd',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Status</Form.Label>
                                            <Form.Select
                                                value={data.delivery_status}
                                                onChange={(e) =>
                                                    setData(
                                                        'delivery_status',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="pending">
                                                    Pending
                                                </option>
                                                <option value="packed">
                                                    Packed
                                                </option>
                                                <option value="picked_up">
                                                    Picked Up
                                                </option>
                                                <option value="delivering">
                                                    Delivering
                                                </option>
                                                <option value="delivered">
                                                    Delivered
                                                </option>
                                                <option value="failed">
                                                    Failed
                                                </option>
                                                <option value="returned">
                                                    Returned
                                                </option>
                                                <option value="cancelled">
                                                    Cancelled
                                                </option>
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Delivered At
                                            </Form.Label>
                                            <Form.Control
                                                type="datetime-local"
                                                value={data.delivered_at}
                                                onChange={(e) =>
                                                    setData(
                                                        'delivered_at',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Failed Reason
                                            </Form.Label>
                                            <Form.Control
                                                value={data.failed_reason}
                                                onChange={(e) =>
                                                    setData(
                                                        'failed_reason',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Note</Form.Label>
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
                                        <div className="d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-success"
                                                disabled={processing}
                                            >
                                                Save
                                            </button>
                                            <Link
                                                href={`/sales/${sale.id}`}
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

SalesDelivery.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default SalesDelivery;

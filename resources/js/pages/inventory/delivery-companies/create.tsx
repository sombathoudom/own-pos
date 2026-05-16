import { Head, Link, useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { index, store } from '@/routes/delivery-companies';

function DeliveryCompaniesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        delivery_cost_usd: '',
        status: 'active',
        note: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(store.url());
    };

    return (
        <>
            <Head title="Add Delivery Company" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Add Delivery Company"
                        pageTitle="Delivery Companies"
                    />

                    <Row>
                        <Col lg={6}>
                            <Card>
                                <Card.Body>
                                    <div className="mb-4">
                                        <h4 className="card-title mb-1">
                                            New Delivery Company
                                        </h4>
                                        <p className="mb-0 text-muted">
                                            Add a courier with its current
                                            delivery cost. You can update the
                                            cost anytime.
                                        </p>
                                    </div>

                                    <Form onSubmit={submit}>
                                        <Row>
                                            <Col lg={12}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="name">
                                                        Company Name
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="name"
                                                        placeholder="e.g. J&T Express, Vet Express, JS"
                                                        value={data.name}
                                                        onChange={(e) =>
                                                            setData(
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={
                                                            errors.name
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                        required
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.name}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="delivery_cost_usd">
                                                        Delivery Cost (USD)
                                                    </Form.Label>
                                                    <div className="input-group">
                                                        <span className="input-group-text">
                                                            $
                                                        </span>
                                                        <Form.Control
                                                            id="delivery_cost_usd"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="1.50"
                                                            value={
                                                                data.delivery_cost_usd
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    'delivery_cost_usd',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className={
                                                                errors.delivery_cost_usd
                                                                    ? 'is-invalid'
                                                                    : ''
                                                            }
                                                            required
                                                        />
                                                        <Form.Control.Feedback
                                                            type="invalid"
                                                            className="d-block"
                                                        >
                                                            {
                                                                errors.delivery_cost_usd
                                                            }
                                                        </Form.Control.Feedback>
                                                    </div>
                                                    <Form.Text className="text-muted">
                                                        What you pay the courier
                                                        per delivery.
                                                    </Form.Text>
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="status">
                                                        Status
                                                    </Form.Label>
                                                    <Form.Select
                                                        id="status"
                                                        value={data.status}
                                                        onChange={(e) =>
                                                            setData(
                                                                'status',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={
                                                            errors.status
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                    >
                                                        <option value="active">
                                                            Active
                                                        </option>
                                                        <option value="inactive">
                                                            Inactive
                                                        </option>
                                                    </Form.Select>
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.status}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>

                                            <Col lg={12}>
                                                <div className="mb-4">
                                                    <Form.Label htmlFor="note">
                                                        Note{' '}
                                                        <span className="fw-normal text-muted">
                                                            (optional)
                                                        </span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="note"
                                                        as="textarea"
                                                        rows={2}
                                                        placeholder="Any notes about this courier..."
                                                        value={data.note}
                                                        onChange={(e) =>
                                                            setData(
                                                                'note',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={
                                                            errors.note
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.note}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Profit preview */}
                                        {data.delivery_cost_usd && (
                                            <div className="alert alert-info mb-4">
                                                <i className="ri-information-line me-2"></i>
                                                <strong>Profit example:</strong>{' '}
                                                If customer pays{' '}
                                                <strong>$2.00</strong> delivery
                                                fee and your cost is{' '}
                                                <strong>
                                                    $
                                                    {Number(
                                                        data.delivery_cost_usd,
                                                    ).toFixed(2)}
                                                </strong>
                                                , delivery profit ={' '}
                                                <strong className="text-success">
                                                    $
                                                    {Math.max(
                                                        0,
                                                        2 -
                                                            Number(
                                                                data.delivery_cost_usd,
                                                            ),
                                                    ).toFixed(2)}
                                                </strong>
                                            </div>
                                        )}

                                        <div className="d-flex gap-2">
                                            <Button
                                                type="submit"
                                                variant="success"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Creating...'
                                                    : 'Create Company'}
                                            </Button>
                                            <Link
                                                href={index.url()}
                                                className="btn btn-secondary"
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

DeliveryCompaniesCreate.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default DeliveryCompaniesCreate;

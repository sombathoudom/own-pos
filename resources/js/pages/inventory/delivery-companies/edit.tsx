import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { index, update } from '@/routes/delivery-companies';
import type { InventoryDeliveryCompany } from '@/types';

type DeliveryCompaniesEditProps = {
    company: InventoryDeliveryCompany;
};

function DeliveryCompaniesEdit() {
    const { company } = usePage<DeliveryCompaniesEditProps>().props;

    const { data, setData, patch, processing, errors } = useForm({
        name: company.name,
        delivery_cost_usd: company.delivery_cost_usd,
        status: company.status,
        note: company.note ?? '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        patch(update.url({ delivery_company: company.id }));
    };

    return (
        <>
            <Head title={`Edit — ${company.name}`} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Edit Delivery Company"
                        pageTitle="Delivery Companies"
                    />

                    <Row>
                        <Col lg={6}>
                            <Card>
                                <Card.Body>
                                    <div className="mb-4">
                                        <h4 className="card-title mb-1">
                                            {company.name}
                                        </h4>
                                        <p className="mb-0 text-muted">
                                            Update the delivery cost or status.
                                            Changes apply to new sales
                                            immediately.
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

                                        {/* Live profit preview */}
                                        {data.delivery_cost_usd && (
                                            <div className="alert alert-info mb-4">
                                                <i className="ri-information-line me-2"></i>
                                                <strong>Profit example:</strong>{' '}
                                                Customer pays{' '}
                                                <strong>$2.00</strong>, your
                                                cost is{' '}
                                                <strong>
                                                    $
                                                    {Number(
                                                        data.delivery_cost_usd,
                                                    ).toFixed(2)}
                                                </strong>{' '}
                                                → delivery profit ={' '}
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
                                                    ? 'Saving...'
                                                    : 'Save Changes'}
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

DeliveryCompaniesEdit.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default DeliveryCompaniesEdit;

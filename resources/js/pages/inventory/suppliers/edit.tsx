import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import {
    update as suppliersUpdate,
    index as suppliersIndex,
} from '@/routes/suppliers';

type Supplier = {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    status: string;
};

type SuppliersEditProps = {
    supplier: Supplier;
};

function SuppliersEdit() {
    const { supplier } = usePage<SuppliersEditProps>().props;
    const { data, setData, patch, processing, errors } = useForm({
        name: supplier.name,
        phone: supplier.phone ?? '',
        email: supplier.email ?? '',
        address: supplier.address ?? '',
        status: supplier.status,
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        patch(suppliersUpdate.url({ supplier: supplier.id }));
    };

    return (
        <>
            <Head title="Edit Supplier" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Edit Supplier" pageTitle="Suppliers" />

                    <Row>
                        <Col lg={8}>
                            <Card>
                                <Card.Body>
                                    <div className="mb-4">
                                        <h4 className="card-title mb-1">
                                            Supplier Details
                                        </h4>
                                        <p className="mb-0 text-muted">
                                            Update the supplier information
                                            below.
                                        </p>
                                    </div>

                                    <Form onSubmit={submit}>
                                        <Row>
                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Form.Label
                                                        htmlFor="name"
                                                        className="form-label"
                                                    >
                                                        Name
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="name"
                                                        value={data.name}
                                                        onChange={(event) =>
                                                            setData(
                                                                'name',
                                                                event.target
                                                                    .value,
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
                                                    <Form.Label
                                                        htmlFor="phone"
                                                        className="form-label"
                                                    >
                                                        Phone
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="phone"
                                                        value={data.phone}
                                                        onChange={(event) =>
                                                            setData(
                                                                'phone',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className={
                                                            errors.phone
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.phone}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Form.Label
                                                        htmlFor="email"
                                                        className="form-label"
                                                    >
                                                        Email
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="email"
                                                        type="email"
                                                        value={data.email}
                                                        onChange={(event) =>
                                                            setData(
                                                                'email',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className={
                                                            errors.email
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.email}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Form.Label
                                                        htmlFor="status"
                                                        className="form-label"
                                                    >
                                                        Status
                                                    </Form.Label>
                                                    <Form.Select
                                                        id="status"
                                                        value={data.status}
                                                        onChange={(event) =>
                                                            setData(
                                                                'status',
                                                                event.target
                                                                    .value,
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
                                                <div className="mb-3">
                                                    <Form.Label
                                                        htmlFor="address"
                                                        className="form-label"
                                                    >
                                                        Address
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        id="address"
                                                        rows={3}
                                                        value={data.address}
                                                        onChange={(event) =>
                                                            setData(
                                                                'address',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className={
                                                            errors.address
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.address}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="d-flex gap-2">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Saving...'
                                                    : 'Save Changes'}
                                            </Button>
                                            <Link
                                                href={suppliersIndex.url()}
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

SuppliersEdit.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default SuppliersEdit;

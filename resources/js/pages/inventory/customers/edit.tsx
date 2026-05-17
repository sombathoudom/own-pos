import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { Card, Col, Container, Form, Row } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { index as customersIndex, update as customersUpdate } from '@/routes/customers';
import type { InventoryCustomer } from '@/types';

type CustomersEditProps = {
    customer: InventoryCustomer;
};

function CustomersEdit() {
    const { customer } = usePage<CustomersEditProps>().props;

    const { data, setData, put, processing, errors } = useForm({
        name: customer.name,
        phone: customer.phone ?? '',
        address: customer.address ?? '',
        status: customer.status,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(customersUpdate.url({ customer: customer.id }));
    };

    return (
        <>
            <Head title={`Edit ${customer.name}`} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Edit Customer" pageTitle="Customers" />

                    <Row>
                        <Col lg={8}>
                            <Card>
                                <Card.Body>
                                    <div className="mb-4">
                                        <h4 className="card-title mb-1">Customer Details</h4>
                                        <p className="mb-0 text-muted">
                                            Update the customer information below.
                                        </p>
                                    </div>

                                    <Form onSubmit={submit}>
                                        <Row>
                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="name" className="form-label">
                                                        Name
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="name"
                                                        value={data.name}
                                                        onChange={(event) => setData('name', event.target.value)}
                                                        className={errors.name ? 'is-invalid' : ''}
                                                        required
                                                    />
                                                    <Form.Control.Feedback type="invalid" className="d-block">
                                                        {errors.name}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="phone" className="form-label">
                                                        Phone
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="phone"
                                                        value={data.phone}
                                                        onChange={(event) => setData('phone', event.target.value)}
                                                        className={errors.phone ? 'is-invalid' : ''}
                                                    />
                                                    <Form.Control.Feedback type="invalid" className="d-block">
                                                        {errors.phone}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="status" className="form-label">
                                                        Status
                                                    </Form.Label>
                                                    <Form.Select
                                                        id="status"
                                                        value={data.status}
                                                        onChange={(event) => setData('status', event.target.value)}
                                                        className={errors.status ? 'is-invalid' : ''}
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid" className="d-block">
                                                        {errors.status}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>

                                            <Col lg={12}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="address" className="form-label">
                                                        Address
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        id="address"
                                                        rows={3}
                                                        value={data.address}
                                                        onChange={(event) => setData('address', event.target.value)}
                                                        className={errors.address ? 'is-invalid' : ''}
                                                    />
                                                    <Form.Control.Feedback type="invalid" className="d-block">
                                                        {errors.address}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="d-flex gap-2">
                                            <button type="submit" className="btn btn-primary" disabled={processing}>
                                                {processing ? 'Saving...' : 'Update Customer'}
                                            </button>
                                            <Link href={customersIndex.url()} className="btn btn-light">
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

CustomersEdit.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default CustomersEdit;

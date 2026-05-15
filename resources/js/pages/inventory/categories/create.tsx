import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import {
    store as categoriesStore,
    index as categoriesIndex,
} from '@/routes/categories';

function CreateCategory() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        default_sale_price_usd: '',
        description: '',
        status: 'active',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(categoriesStore.url());
    };

    return (
        <>
            <Head title="Create Category" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Create Category"
                        pageTitle="Categories"
                    />

                    <Row>
                        <Col xs={12}>
                            <Card>
                                <Card.Body>
                                    <div className="mb-4">
                                        <h4 className="card-title mb-1">
                                            New Category
                                        </h4>
                                        <p className="mb-0 text-muted">
                                            Add a new product category.
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
                                                        htmlFor="default_sale_price_usd"
                                                        className="form-label"
                                                    >
                                                        Default Sale Price (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="default_sale_price_usd"
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            data.default_sale_price_usd
                                                        }
                                                        onChange={(event) =>
                                                            setData(
                                                                'default_sale_price_usd',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className={
                                                            errors.default_sale_price_usd
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {
                                                            errors.default_sale_price_usd
                                                        }
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Form.Label
                                                        htmlFor="description"
                                                        className="form-label"
                                                    >
                                                        Description
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="description"
                                                        as="textarea"
                                                        rows={3}
                                                        value={data.description}
                                                        onChange={(event) =>
                                                            setData(
                                                                'description',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className={
                                                            errors.description
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.description}
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
                                                        size="lg"
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
                                        </Row>

                                        <div className="d-flex gap-2">
                                            <Button
                                                type="submit"
                                                className="btn btn-success"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Creating...'
                                                    : 'Create Category'}
                                            </Button>
                                            <Link
                                                href={categoriesIndex.url()}
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

CreateCategory.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default CreateCategory;

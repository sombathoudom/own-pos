import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
} from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import {
    update as categoriesUpdate,
    index as categoriesIndex,
} from '@/routes/categories';

type Category = {
    id: number;
    name: string;
    default_sale_price_usd: string;
    description: string | null;
    status: string;
};

type EditCategoryProps = {
    category: Category;
};

function EditCategory() {
    const { category } = usePage<EditCategoryProps>().props;
    const flashToast = usePage().props.toast as
        | { type: string; message: string }
        | undefined;

    const { data, setData, put, processing, errors } = useForm({
        name: category.name,
        default_sale_price_usd: category.default_sale_price_usd,
        description: category.description ?? '',
        status: category.status,
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(categoriesUpdate.url({ category: category.id }));
    };

    return (
        <>
            <Head title={`Edit - ${category.name}`} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Edit Category" pageTitle="Categories" />

                    <Row>
                        <Col xs={12}>
                            {flashToast && (
                                <Alert
                                    variant={
                                        flashToast.type === 'error'
                                            ? 'danger'
                                            : flashToast.type
                                    }
                                    dismissible
                                >
                                    {flashToast.message}
                                </Alert>
                            )}

                            <Card>
                                <Card.Body>
                                    <div className="mb-4">
                                        <h4 className="card-title mb-1">
                                            Edit Category
                                        </h4>
                                        <p className="mb-0 text-muted">
                                            Update category details for{' '}
                                            <strong>{category.name}</strong>.
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
                                        </Row>

                                        <div className="d-flex gap-2">
                                            <Button
                                                type="submit"
                                                className="btn btn-success"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Saving...'
                                                    : 'Save changes'}
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

EditCategory.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default EditCategory;

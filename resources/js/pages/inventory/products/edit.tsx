import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    type ChangeEvent,
    type FormEvent,
    type ReactNode,
    useEffect,
    useState,
} from 'react';
import {
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Table,
} from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import {
    index as productsIndex,
    update as productsUpdate,
} from '@/routes/products';
import type { InventoryCategory, InventoryProduct } from '@/types';

type ProductEditPageProps = {
    product: InventoryProduct;
    categories: InventoryCategory[];
};

type ProductEditFormData = {
    _method: 'patch';
    name: string;
    category_id: string;
    description: string;
    status: 'active' | 'inactive';
    image: File | null;
    remove_image: boolean;
};

function ProductsEdit() {
    const { product, categories } = usePage<ProductEditPageProps>().props;
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
        product.image_url ?? null,
    );

    const { data, setData, post, processing, errors, progress } =
        useForm<ProductEditFormData>({
            _method: 'patch',
            name: product.name,
            category_id: String(product.category_id),
            description: product.description ?? '',
            status: (product.status === 'inactive'
                ? 'inactive'
                : 'active') as ProductEditFormData['status'],
            image: null,
            remove_image: false,
        });

    useEffect(() => {
        if (data.image) {
            const objectUrl = URL.createObjectURL(data.image);
            setImagePreviewUrl(objectUrl);

            return () => {
                URL.revokeObjectURL(objectUrl);
            };
        }

        setImagePreviewUrl(
            data.remove_image ? null : (product.image_url ?? null),
        );
    }, [data.image, data.remove_image, product.image_url]);

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0] ?? null;
        setData((current) => ({
            ...current,
            image: file,
            remove_image: false,
        }));
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        post(productsUpdate.url({ product: product.id }), {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Edit Product" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Edit Product" pageTitle="Products" />

                    <Form onSubmit={submit}>
                        <Row>
                            <Col xl={8}>
                                <Card className="mb-3">
                                    <Card.Body>
                                        <div className="mb-4">
                                            <h4 className="card-title mb-1">
                                                Product details
                                            </h4>
                                            <p className="mb-0 text-muted">
                                                Update the base product
                                                information and replace the
                                                image if needed.
                                            </p>
                                        </div>

                                        <Row className="g-3">
                                            <Col lg={8}>
                                                <div>
                                                    <Form.Label htmlFor="name">
                                                        Product name
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
                                                        isInvalid={
                                                            !!errors.name
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

                                            <Col lg={4}>
                                                <div>
                                                    <Form.Label htmlFor="category_id">
                                                        Category
                                                    </Form.Label>
                                                    <Form.Select
                                                        id="category_id"
                                                        value={data.category_id}
                                                        onChange={(event) =>
                                                            setData(
                                                                'category_id',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.category_id
                                                        }
                                                        required
                                                    >
                                                        <option value="">
                                                            Select category
                                                        </option>
                                                        {categories.map(
                                                            (category) => (
                                                                <option
                                                                    key={
                                                                        category.id
                                                                    }
                                                                    value={String(
                                                                        category.id,
                                                                    )}
                                                                >
                                                                    {
                                                                        category.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </Form.Select>
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.category_id}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>

                                            <Col lg={12}>
                                                <div>
                                                    <Form.Label htmlFor="description">
                                                        Description
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        id="description"
                                                        rows={3}
                                                        value={data.description}
                                                        onChange={(event) =>
                                                            setData(
                                                                'description',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.description
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

                                            <Col lg={4}>
                                                <div>
                                                    <Form.Label htmlFor="status">
                                                        Status
                                                    </Form.Label>
                                                    <Form.Select
                                                        id="status"
                                                        value={data.status}
                                                        onChange={(event) =>
                                                            setData(
                                                                'status',
                                                                event.target
                                                                    .value as ProductEditFormData['status'],
                                                            )
                                                        }
                                                        isInvalid={
                                                            !!errors.status
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
                                    </Card.Body>
                                </Card>

                                <Card>
                                    <Card.Body>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div>
                                                <h4 className="card-title mb-1">
                                                    Existing variants
                                                </h4>
                                                <p className="mb-0 text-muted">
                                                    Variants are created during
                                                    product setup and shown here
                                                    for reference.
                                                </p>
                                            </div>
                                            <span className="badge bg-primary-subtle text-primary">
                                                {product.variants.length}{' '}
                                                variant
                                                {product.variants.length !== 1
                                                    ? 's'
                                                    : ''}
                                            </span>
                                        </div>

                                        <Table
                                            responsive
                                            className="mb-0 align-middle"
                                        >
                                            <thead>
                                                <tr>
                                                    <th>SKU</th>
                                                    <th>Style</th>
                                                    <th>Color</th>
                                                    <th>Size</th>
                                                    <th>Sale Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {product.variants.map(
                                                    (variant) => (
                                                        <tr key={variant.id}>
                                                            <td>
                                                                {variant.sku}
                                                            </td>
                                                            <td>
                                                                {variant.style_name ||
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {variant.color ||
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {variant.size}
                                                            </td>
                                                            <td>
                                                                $
                                                                {Number(
                                                                    variant.sale_price_usd,
                                                                ).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xl={4}>
                                <Card className="mb-3">
                                    <Card.Body>
                                        <h4 className="card-title mb-3">
                                            Product image
                                        </h4>

                                        <div className="rounded-3 bg-light-subtle border p-3 text-center">
                                            {imagePreviewUrl ? (
                                                <img
                                                    src={imagePreviewUrl}
                                                    alt={product.name}
                                                    className="object-fit-cover mb-3 rounded border"
                                                    style={{
                                                        width: '100%',
                                                        maxHeight: 260,
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className="d-flex align-items-center justify-content-center mb-3 rounded border bg-white text-muted"
                                                    style={{ height: 260 }}
                                                >
                                                    <div>
                                                        <i className="ri-image-line fs-1 d-block mb-2"></i>
                                                        <span>No image</span>
                                                    </div>
                                                </div>
                                            )}

                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                isInvalid={!!errors.image}
                                            />
                                            <Form.Control.Feedback
                                                type="invalid"
                                                className="d-block text-start"
                                            >
                                                {errors.image}
                                            </Form.Control.Feedback>

                                            {(imagePreviewUrl ||
                                                product.image_url) && (
                                                <Button
                                                    type="button"
                                                    variant="light"
                                                    className="mt-2 w-100"
                                                    onClick={() => {
                                                        setData((current) => ({
                                                            ...current,
                                                            image: null,
                                                            remove_image: true,
                                                        }));
                                                    }}
                                                >
                                                    Remove image
                                                </Button>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card>
                                    <Card.Body>
                                        <h4 className="card-title mb-3">
                                            Save changes
                                        </h4>

                                        <div className="vstack small mb-3 gap-2 text-muted">
                                            <span>
                                                {product.variants.length}{' '}
                                                existing variant
                                                {product.variants.length !== 1
                                                    ? 's'
                                                    : ''}
                                            </span>
                                            {progress && (
                                                <span>
                                                    Uploading{' '}
                                                    {progress.percentage}%
                                                </span>
                                            )}
                                        </div>

                                        <div className="d-grid gap-2">
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
                                                className="btn btn-light"
                                                href={productsIndex.url()}
                                            >
                                                Cancel
                                            </Link>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Form>
                </Container>
            </div>
        </>
    );
}

ProductsEdit.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default ProductsEdit;

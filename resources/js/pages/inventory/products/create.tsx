import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    type ChangeEvent,
    type FormEvent,
    type ReactNode,
    useEffect,
    useState,
} from 'react';
import {
    Alert,
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
    store as productsStore,
} from '@/routes/products';
import type { InventoryCategory } from '@/types';

type VariantRow = {
    sku: string;
    style_name: string;
    color: string;
    size: string;
    sale_price_usd: string;
};

type ProductCreateFormData = {
    name: string;
    category_id: string;
    description: string;
    status: 'active' | 'inactive';
    image: File | null;
    variants: VariantRow[];
};

type ProductCreatePageProps = {
    categories: InventoryCategory[];
};

const emptyVariant = (defaultPrice = '0'): VariantRow => ({
    sku: '',
    style_name: '',
    color: '',
    size: '',
    sale_price_usd: defaultPrice,
});

const normalizeSkuSegment = (value: string): string => {
    return value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 24);
};

const buildSmartSku = (productName: string, variant: VariantRow): string => {
    const segments = [
        productName,
        variant.style_name,
        variant.color,
        variant.size,
    ]
        .map(normalizeSkuSegment)
        .filter(Boolean);

    return segments.join('-') || 'SKU';
};

function ProductsCreate() {
    const { categories } = usePage<ProductCreatePageProps>().props;
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const { data, setData, post, processing, errors, progress } =
        useForm<ProductCreateFormData>({
            name: '',
            category_id: '',
            description: '',
            status: 'active',
            image: null,
            variants: [emptyVariant()],
        });

    useEffect(() => {
        if (!data.image) {
            setImagePreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(data.image);
        setImagePreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [data.image]);

    const addVariant = (): void => {
        const selectedCategory = categories.find(
            (c) => String(c.id) === data.category_id,
        );
        const defaultPrice = selectedCategory?.default_sale_price_usd
            ? String(selectedCategory.default_sale_price_usd)
            : '0';
        setData('variants', [...data.variants, emptyVariant(defaultPrice)]);
    };

    const addVariants = (sizes: string[]): void => {
        const selectedCategory = categories.find(
            (c) => String(c.id) === data.category_id,
        );
        const defaultPrice = selectedCategory?.default_sale_price_usd
            ? String(selectedCategory.default_sale_price_usd)
            : '0';

        const existingSizes = new Set(
            data.variants.map((v) => v.size.toUpperCase()),
        );
        const newVariants = sizes
            .filter((size) => !existingSizes.has(size.toUpperCase()))
            .map((size) => {
                const variant: VariantRow = {
                    sku: '',
                    style_name: '',
                    color: '',
                    size,
                    sale_price_usd: defaultPrice,
                };
                return {
                    ...variant,
                    sku: buildSmartSku(data.name, variant),
                };
            });

        setData('variants', [...data.variants, ...newVariants]);
    };

    const removeVariant = (index: number): void => {
        setData(
            'variants',
            data.variants.filter((_, currentIndex) => currentIndex !== index),
        );
    };

    const updateVariant = (
        index: number,
        field: keyof VariantRow,
        value: string,
    ): void => {
        const variants = [...data.variants];
        variants[index] = { ...variants[index], [field]: value };
        setData('variants', variants);
    };

    const applySuggestedSku = (index: number): void => {
        const currentVariant = data.variants[index];
        const suggestedSku = buildSmartSku(data.name, currentVariant);

        updateVariant(index, 'sku', suggestedSku);
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0] ?? null;
        setData('image', file);
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        post(productsStore.url(), {
            forceFormData: true,
        });
    };

    const variantError = (
        index: number,
        field: keyof VariantRow,
    ): string | undefined => {
        return errors[`variants.${index}.${field}` as keyof typeof errors] as
            | string
            | undefined;
    };

    return (
        <>
            <Head title="Create Product" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Create Product" pageTitle="Products" />

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
                                                Add the base product once, then
                                                create size and color variants
                                                below.
                                            </p>
                                        </div>

                                        {errors.variants && (
                                            <Alert
                                                variant="danger"
                                                className="mb-3"
                                            >
                                                {errors.variants}
                                            </Alert>
                                        )}

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
                                                        placeholder="Oversized linen shirt"
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
                                                        onChange={(event) => {
                                                            const categoryId =
                                                                event.target
                                                                    .value;
                                                            setData(
                                                                'category_id',
                                                                categoryId,
                                                            );

                                                            // Auto-fill sale price from category
                                                            if (categoryId) {
                                                                const selectedCategory =
                                                                    categories.find(
                                                                        (c) =>
                                                                            String(
                                                                                c.id,
                                                                            ) ===
                                                                            categoryId,
                                                                    );

                                                                console.log(
                                                                    'Selected category:',
                                                                    selectedCategory,
                                                                );

                                                                if (
                                                                    selectedCategory?.default_sale_price_usd
                                                                ) {
                                                                    const updatedVariants =
                                                                        data.variants.map(
                                                                            (
                                                                                v,
                                                                            ) => ({
                                                                                ...v,
                                                                                sale_price_usd:
                                                                                    String(
                                                                                        selectedCategory.default_sale_price_usd,
                                                                                    ),
                                                                            }),
                                                                        );

                                                                    console.log(
                                                                        'Updating variants with price:',
                                                                        selectedCategory.default_sale_price_usd,
                                                                    );

                                                                    setData(
                                                                        'variants',
                                                                        updatedVariants,
                                                                    );
                                                                } else {
                                                                    console.log(
                                                                        'No default price set for category',
                                                                    );
                                                                }
                                                            }
                                                        }}
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
                                                        placeholder="Fabric, fit, or anything staff should know."
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
                                                                    .value as ProductCreateFormData['status'],
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
                                                    Variants
                                                </h4>
                                                <p className="mb-0 text-muted">
                                                    SKU can be typed manually or
                                                    auto-generated from the
                                                    product name, style, color,
                                                    and size.
                                                </p>
                                            </div>

                                            <div className="d-flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline-info"
                                                    size="sm"
                                                    onClick={() =>
                                                        addVariants([
                                                            'M',
                                                            'L',
                                                            'XL',
                                                            '2XL',
                                                            '3XL',
                                                        ])
                                                    }
                                                    title="Add M, L, XL, 2XL, 3XL"
                                                >
                                                    + Shirt Sizes (M-3XL)
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={addVariant}
                                                >
                                                    + Add Variant
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="table-responsive">
                                            <Table
                                                className="table-nowrap align-middle"
                                                responsive
                                            >
                                                <thead>
                                                    <tr>
                                                        <th
                                                            style={{
                                                                minWidth: 180,
                                                            }}
                                                        >
                                                            SKU
                                                        </th>
                                                        <th>Style</th>
                                                        <th>Color</th>
                                                        <th>Size</th>
                                                        <th>
                                                            Sale Price (USD)
                                                        </th>
                                                        <th className="text-end">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.variants.map(
                                                        (variant, index) => {
                                                            const suggestedSku =
                                                                buildSmartSku(
                                                                    data.name,
                                                                    variant,
                                                                );

                                                            return (
                                                                <tr key={index}>
                                                                    <td>
                                                                        <div className="d-flex gap-2">
                                                                            <Form.Control
                                                                                size="sm"
                                                                                value={
                                                                                    variant.sku
                                                                                }
                                                                                onChange={(
                                                                                    event,
                                                                                ) =>
                                                                                    updateVariant(
                                                                                        index,
                                                                                        'sku',
                                                                                        event
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                onBlur={() => {
                                                                                    if (
                                                                                        !variant.sku.trim()
                                                                                    ) {
                                                                                        applySuggestedSku(
                                                                                            index,
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                isInvalid={
                                                                                    !!variantError(
                                                                                        index,
                                                                                        'sku',
                                                                                    )
                                                                                }
                                                                                placeholder={
                                                                                    suggestedSku
                                                                                }
                                                                                required
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant="light"
                                                                                onClick={() =>
                                                                                    applySuggestedSku(
                                                                                        index,
                                                                                    )
                                                                                }
                                                                            >
                                                                                Smart
                                                                            </Button>
                                                                        </div>
                                                                        <Form.Control.Feedback
                                                                            type="invalid"
                                                                            className="d-block"
                                                                        >
                                                                            {variantError(
                                                                                index,
                                                                                'sku',
                                                                            )}
                                                                        </Form.Control.Feedback>
                                                                    </td>
                                                                    <td>
                                                                        <Form.Control
                                                                            size="sm"
                                                                            value={
                                                                                variant.style_name
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateVariant(
                                                                                    index,
                                                                                    'style_name',
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            placeholder="Relaxed fit"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <Form.Control
                                                                            size="sm"
                                                                            value={
                                                                                variant.color
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateVariant(
                                                                                    index,
                                                                                    'color',
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            placeholder="Navy"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <Form.Control
                                                                            size="sm"
                                                                            value={
                                                                                variant.size
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateVariant(
                                                                                    index,
                                                                                    'size',
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            isInvalid={
                                                                                !!variantError(
                                                                                    index,
                                                                                    'size',
                                                                                )
                                                                            }
                                                                            placeholder="M"
                                                                            required
                                                                        />
                                                                        <Form.Control.Feedback
                                                                            type="invalid"
                                                                            className="d-block"
                                                                        >
                                                                            {variantError(
                                                                                index,
                                                                                'size',
                                                                            )}
                                                                        </Form.Control.Feedback>
                                                                    </td>
                                                                    <td>
                                                                        <Form.Control
                                                                            size="sm"
                                                                            type="number"
                                                                            min="0.01"
                                                                            step="0.01"
                                                                            value={
                                                                                variant.sale_price_usd
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateVariant(
                                                                                    index,
                                                                                    'sale_price_usd',
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            isInvalid={
                                                                                !!variantError(
                                                                                    index,
                                                                                    'sale_price_usd',
                                                                                )
                                                                            }
                                                                            required
                                                                        />
                                                                        <Form.Control.Feedback
                                                                            type="invalid"
                                                                            className="d-block"
                                                                        >
                                                                            {variantError(
                                                                                index,
                                                                                'sale_price_usd',
                                                                            )}
                                                                        </Form.Control.Feedback>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="outline-danger"
                                                                            onClick={() =>
                                                                                removeVariant(
                                                                                    index,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                data
                                                                                    .variants
                                                                                    .length ===
                                                                                1
                                                                            }
                                                                        >
                                                                            Remove
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        },
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
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
                                                    alt="Product preview"
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
                                                        <i className="ri-image-add-line fs-1 d-block mb-2"></i>
                                                        <span>
                                                            No image selected
                                                        </span>
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
                                            <div className="small mt-2 text-start text-muted">
                                                JPG, PNG, or WEBP up to 5MB.
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card>
                                    <Card.Body>
                                        <h4 className="card-title mb-3">
                                            Save product
                                        </h4>

                                        <div className="vstack small mb-3 gap-2 text-muted">
                                            <span>
                                                {data.variants.length} variant
                                                {data.variants.length > 1
                                                    ? 's'
                                                    : ''}{' '}
                                                ready
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
                                                    : 'Create Product'}
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

ProductsCreate.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default ProductsCreate;

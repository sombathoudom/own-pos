import { Head, Link, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Table,
} from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';
import {
    create as productsCreate,
    destroy as productsDestroy,
    edit as productsEdit,
    index as productsIndex,
} from '@/routes/products';
import type { ProductIndexPageProps } from '@/types';

function ProductsIndex() {
    const { products, filters, toast } = usePage<ProductIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            productsIndex.url(),
            { search: search || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleDelete = (id: number) => {
        if (!confirm('Delete this product?')) return;
        router.delete(productsDestroy.url({ product: id }), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Products" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Products" pageTitle="Inventory" />

                    {toast && (
                        <Alert
                            variant={
                                toast.type === 'error' ? 'danger' : toast.type
                            }
                            className="mb-3"
                        >
                            {toast.message}
                        </Alert>
                    )}

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <Card.Header className="card-header border-0">
                                    <Row className="align-items-center gy-3">
                                        <div className="col-sm">
                                            <h5 className="card-title mb-0">
                                                Products
                                            </h5>
                                        </div>
                                        <div className="col-sm-auto">
                                            <div className="d-flex flex-wrap gap-1">
                                                <Form
                                                    onSubmit={handleSearch}
                                                    className="d-flex gap-2"
                                                >
                                                    <Form.Control
                                                        type="search"
                                                        placeholder="Search products..."
                                                        value={search}
                                                        onChange={(event) =>
                                                            setSearch(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        style={{
                                                            minWidth: 220,
                                                        }}
                                                    />
                                                    <Button
                                                        type="submit"
                                                        variant="light"
                                                    >
                                                        Search
                                                    </Button>
                                                    {search && (
                                                        <Button
                                                            type="button"
                                                            variant="light"
                                                            onClick={() => {
                                                                setSearch('');
                                                                router.get(
                                                                    productsIndex.url(),
                                                                    {},
                                                                    {
                                                                        preserveScroll: true,
                                                                        preserveState: true,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            Clear
                                                        </Button>
                                                    )}
                                                </Form>
                                                <Link
                                                    className="btn btn-success"
                                                    href={productsCreate.url()}
                                                >
                                                    + Add Product
                                                </Link>
                                            </div>
                                        </div>
                                    </Row>
                                </Card.Header>

                                <Card.Body className="pt-0">
                                    <Table className="table-striped" responsive>
                                        <thead>
                                            <tr>
                                                <th style={{ width: 72 }}>
                                                    Image
                                                </th>
                                                <th>Name</th>
                                                <th>Category</th>
                                                <th>Status</th>
                                                <th>Variants</th>
                                                <th>Total Stock</th>
                                                <th className="text-end">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.data.map((product) => {
                                                const variantCount =
                                                    product.variants.length;
                                                const totalStock =
                                                    product.variants.reduce(
                                                        (sum, v) =>
                                                            sum +
                                                            (v.stockBalance
                                                                ?.qty_on_hand ??
                                                                0),
                                                        0,
                                                    );

                                                return (
                                                    <tr key={product.id}>
                                                        <td>
                                                            <div className="avatar-sm">
                                                                {product.image_url ? (
                                                                    <img
                                                                        src={
                                                                            product.image_url
                                                                        }
                                                                        alt={
                                                                            product.name
                                                                        }
                                                                        className="object-fit-cover rounded border"
                                                                        style={{
                                                                            width: 48,
                                                                            height: 48,
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="avatar-title bg-light rounded border text-muted">
                                                                        <i className="ri-image-line"></i>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="fw-medium">
                                                            {product.name}
                                                        </td>
                                                        <td>
                                                            {product.category
                                                                ?.name ?? '-'}
                                                        </td>
                                                        <td>
                                                            <Badge
                                                                bg={
                                                                    product.status ===
                                                                    'active'
                                                                        ? 'success-subtle text-success'
                                                                        : 'danger-subtle text-danger'
                                                                }
                                                            >
                                                                {product.status}
                                                            </Badge>
                                                        </td>
                                                        <td>{variantCount}</td>
                                                        <td>{totalStock}</td>
                                                        <td className="text-end">
                                                            <Link
                                                                className="btn btn-sm btn-outline-secondary me-2"
                                                                href={productsEdit.url(
                                                                    {
                                                                        product:
                                                                            product.id,
                                                                    },
                                                                )}
                                                            >
                                                                Edit
                                                            </Link>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-danger"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        product.id,
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {products.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No products found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>

                                    <Pagination paginator={products} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

ProductsIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default ProductsIndex;

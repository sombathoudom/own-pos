import { Head, Link, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import {
    Alert,
    Badge,
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
    create as categoriesCreate,
    destroy as categoriesDestroy,
    edit as categoriesEdit,
    index as categoriesIndex,
} from '@/routes/categories';
import type { CategoryIndexPageProps } from '@/types';

function CategoriesIndex() {
    const { categories, filters, toast } =
        usePage<CategoryIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            categoriesIndex.url(),
            { search: search || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Categories" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Categories" pageTitle="Inventory" />

                    <Row>
                        <Col xs={12}>
                            {toast && (
                                <Alert
                                    variant={
                                        toast.type === 'error'
                                            ? 'danger'
                                            : toast.type
                                    }
                                    className="mb-3"
                                >
                                    {toast.message}
                                </Alert>
                            )}

                            <Card>
                                <Card.Body>
                                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 gap-3">
                                        <h4 className="card-title mb-0">
                                            Categories
                                        </h4>

                                        <div className="d-flex flex-wrap gap-2">
                                            <Form
                                                onSubmit={submit}
                                                className="d-flex gap-2"
                                            >
                                                <Form.Control
                                                    type="search"
                                                    placeholder="Search categories..."
                                                    value={search}
                                                    onChange={(event) =>
                                                        setSearch(
                                                            event.target.value,
                                                        )
                                                    }
                                                    style={{ minWidth: 220 }}
                                                />
                                                <button
                                                    type="submit"
                                                    className="btn btn-light"
                                                >
                                                    Search
                                                </button>
                                                {search && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-light"
                                                        onClick={() => {
                                                            setSearch('');
                                                            router.get(
                                                                categoriesIndex.url(),
                                                                {},
                                                                {
                                                                    preserveScroll: true,
                                                                    preserveState: true,
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </Form>

                                            <Link
                                                href={categoriesCreate.url()}
                                                className="btn btn-success"
                                            >
                                                <i className="ri-add-line me-1 align-bottom"></i>
                                                Add Category
                                            </Link>
                                        </div>
                                    </div>

                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Default Price</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.data.map((category) => (
                                                <tr key={category.id}>
                                                    <td>{category.name}</td>
                                                    <td>
                                                        $
                                                        {
                                                            category.default_sale_price_usd
                                                        }
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg={
                                                                category.status ===
                                                                'active'
                                                                    ? 'success'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {category.status}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <Link
                                                                href={categoriesEdit.url(
                                                                    {
                                                                        category:
                                                                            category.id,
                                                                    },
                                                                )}
                                                                className="btn btn-sm btn-soft-primary"
                                                            >
                                                                <i className="ri-pencil-line"></i>
                                                            </Link>
                                                            <Link
                                                                href={categoriesDestroy.url(
                                                                    {
                                                                        category:
                                                                            category.id,
                                                                    },
                                                                )}
                                                                method="delete"
                                                                as="button"
                                                                className="btn btn-sm btn-soft-danger"
                                                                onBefore={() =>
                                                                    confirm(
                                                                        'Are you sure you want to delete this category?',
                                                                    )
                                                                }
                                                            >
                                                                <i className="ri-delete-bin-line"></i>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {categories.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No categories found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>

                                    <Pagination paginator={categories} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

CategoriesIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default CategoriesIndex;

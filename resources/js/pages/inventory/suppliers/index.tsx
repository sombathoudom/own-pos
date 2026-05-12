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
    create as suppliersCreate,
    destroy as suppliersDestroy,
    edit as suppliersEdit,
    index as suppliersIndex,
} from '@/routes/suppliers';
import type { SupplierIndexPageProps } from '@/types';

function SuppliersIndex() {
    const { suppliers, filters, toast } =
        usePage<SupplierIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            suppliersIndex.url(),
            { search: search || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this supplier?')) {
            router.delete(suppliersDestroy.url({ supplier: id }));
        }
    };

    return (
        <>
            <Head title="Suppliers" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Suppliers" pageTitle="Inventory" />

                    {toast && (
                        <Alert
                            variant={
                                toast.type === 'success' ? 'success' : 'danger'
                            }
                            className="mb-3"
                        >
                            {toast.message}
                        </Alert>
                    )}

                    <Row>
                        <Col xs={12}>
                            <Card>
                                <Card.Body>
                                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 gap-3">
                                        <Form
                                            onSubmit={handleSearch}
                                            className="d-flex gap-2"
                                        >
                                            <Form.Control
                                                type="search"
                                                placeholder="Search suppliers..."
                                                value={search}
                                                onChange={(event) =>
                                                    setSearch(
                                                        event.target.value,
                                                    )
                                                }
                                                style={{ minWidth: 240 }}
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
                                                            suppliersIndex.url(),
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
                                            href={suppliersCreate.url()}
                                            className="btn btn-primary"
                                        >
                                            Add Supplier
                                        </Link>
                                    </div>

                                    <Table
                                        responsive
                                        className="table-striped align-middle"
                                    >
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Phone</th>
                                                <th>Email</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {suppliers.data.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="text-center text-muted"
                                                    >
                                                        No suppliers found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                suppliers.data.map(
                                                    (supplier) => (
                                                        <tr key={supplier.id}>
                                                            <td>
                                                                {supplier.name}
                                                            </td>
                                                            <td>
                                                                {supplier.phone ||
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                {supplier.email ||
                                                                    '—'}
                                                            </td>
                                                            <td>
                                                                <Badge
                                                                    bg={
                                                                        supplier.status ===
                                                                        'active'
                                                                            ? 'success'
                                                                            : 'secondary'
                                                                    }
                                                                >
                                                                    {
                                                                        supplier.status
                                                                    }
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                <Link
                                                                    href={suppliersEdit.url(
                                                                        {
                                                                            supplier:
                                                                                supplier.id,
                                                                        },
                                                                    )}
                                                                    className="btn btn-sm btn-outline-info me-1"
                                                                >
                                                                    Edit
                                                                </Link>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-danger"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            supplier.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                    </Table>

                                    <Pagination paginator={suppliers} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

SuppliersIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default SuppliersIndex;

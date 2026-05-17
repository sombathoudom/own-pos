import { Head, Link, router, usePage } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';
import { create as customersCreate, destroy as customersDestroy, edit as customersEdit, index as customersIndex } from '@/routes/customers';
import type { CustomerIndexPageProps } from '@/types';

function CustomersIndex() {
    const { customers, filters, toast } = usePage<CustomerIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            customersIndex.url(),
            { search: search || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            router.delete(customersDestroy.url({ customer: id }));
        }
    };

    return (
        <>
            <Head title="Customers" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Customers" pageTitle="Inventory" />

                    {toast && (
                        <Alert
                            variant={toast.type === 'success' ? 'success' : 'danger'}
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
                                        <Form onSubmit={handleSearch} className="d-flex gap-2">
                                            <Form.Control
                                                type="search"
                                                placeholder="Search customers..."
                                                value={search}
                                                onChange={(event) => setSearch(event.target.value)}
                                                style={{ minWidth: 240 }}
                                            />
                                            <button type="submit" className="btn btn-light">
                                                Search
                                            </button>
                                            {search && (
                                                <button
                                                    type="button"
                                                    className="btn btn-light"
                                                    onClick={() => {
                                                        setSearch('');
                                                        router.get(customersIndex.url(), {}, {
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                        });
                                                    }}
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </Form>

                                        <Link href={customersCreate.url()} className="btn btn-primary">
                                            Add Customer
                                        </Link>
                                    </div>

                                    <Table responsive className="table-striped align-middle">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Phone</th>
                                                <th>Address</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customers.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center text-muted">
                                                        No customers found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                customers.data.map((customer) => (
                                                    <tr key={customer.id}>
                                                        <td>{customer.name}</td>
                                                        <td>{customer.phone || '—'}</td>
                                                        <td>{customer.address || '—'}</td>
                                                        <td>
                                                            <Badge bg={customer.status === 'active' ? 'success' : 'secondary'}>
                                                                {customer.status}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Link
                                                                href={customersEdit.url({ customer: customer.id })}
                                                                className="btn btn-sm btn-outline-info me-1"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-danger"
                                                                onClick={() => handleDelete(customer.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>

                                    <Pagination paginator={customers} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

CustomersIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default CustomersIndex;

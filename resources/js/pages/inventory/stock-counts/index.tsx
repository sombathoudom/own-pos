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
import type { StockCountIndexPageProps } from '@/types';

function StockCountsIndex() {
    const { counts, filters, toast } =
        usePage<StockCountIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/stock-counts',
            { search: search || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Stock Counts" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Stock Counts" pageTitle="Inventory" />
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
                                            Stock Counts
                                        </h4>
                                        <div className="d-flex flex-wrap gap-2">
                                            <Form
                                                onSubmit={submit}
                                                className="d-flex gap-2"
                                            >
                                                <Form.Control
                                                    type="search"
                                                    placeholder="Search date..."
                                                    value={search}
                                                    onChange={(e) =>
                                                        setSearch(
                                                            e.target.value,
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
                                                                '/stock-counts',
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
                                                href="/stock-counts/create"
                                                className="btn btn-success"
                                            >
                                                <i className="ri-add-line me-1 align-bottom"></i>{' '}
                                                New Count
                                            </Link>
                                        </div>
                                    </div>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Items</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {counts.data.map((count) => (
                                                <tr key={count.id}>
                                                    <td>{count.count_date}</td>
                                                    <td>
                                                        <Badge
                                                            bg={
                                                                count.status ===
                                                                'adjusted'
                                                                    ? 'success'
                                                                    : count.status ===
                                                                        'draft'
                                                                      ? 'warning'
                                                                      : 'secondary'
                                                            }
                                                        >
                                                            {count.status}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {count.items?.length ??
                                                            0}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <Link
                                                                href={`/stock-counts/${count.id}`}
                                                                className="btn btn-sm btn-soft-primary"
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </Link>
                                                            {count.status ===
                                                                'draft' && (
                                                                <Link
                                                                    href={`/stock-counts/${count.id}/approve`}
                                                                    method="post"
                                                                    as="button"
                                                                    className="btn btn-sm btn-soft-success"
                                                                    onBefore={() =>
                                                                        confirm(
                                                                            'Approve and adjust stock?',
                                                                        )
                                                                    }
                                                                >
                                                                    <i className="ri-check-line"></i>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {counts.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No counts found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                    <Pagination paginator={counts} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

StockCountsIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default StockCountsIndex;

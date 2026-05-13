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
    create as adjustmentsCreate,
    index as adjustmentsIndex,
} from '@/routes/stock-adjustments';
import type { StockAdjustmentIndexPageProps } from '@/types';

function StockAdjustmentsIndex() {
    const { adjustments, filters, toast } =
        usePage<StockAdjustmentIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            adjustmentsIndex.url(),
            { search: search || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Stock Adjustments" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Stock Adjustments"
                        pageTitle="Inventory"
                    />
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
                                            Stock Adjustments
                                        </h4>
                                        <div className="d-flex flex-wrap gap-2">
                                            <Form
                                                onSubmit={submit}
                                                className="d-flex gap-2"
                                            >
                                                <Form.Control
                                                    type="search"
                                                    placeholder="Search..."
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
                                                                adjustmentsIndex.url(),
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
                                                href={adjustmentsCreate.url()}
                                                className="btn btn-success"
                                            >
                                                <i className="ri-add-line me-1 align-bottom"></i>{' '}
                                                New Adjustment
                                            </Link>
                                        </div>
                                    </div>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Reason</th>
                                                <th>Items</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adjustments.data.map((adj) => (
                                                <tr key={adj.id}>
                                                    <td>
                                                        {adj.adjustment_date}
                                                    </td>
                                                    <td>{adj.reason ?? '-'}</td>
                                                    <td>
                                                        {adj.items?.length ?? 0}
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg={
                                                                adj.approved_at
                                                                    ? 'success'
                                                                    : 'warning'
                                                            }
                                                        >
                                                            {adj.approved_at
                                                                ? 'Approved'
                                                                : 'Pending'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <Link
                                                                href={`/stock-adjustments/${adj.id}`}
                                                                className="btn btn-sm btn-soft-primary"
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </Link>
                                                            {!adj.approved_at && (
                                                                <Link
                                                                    href={`/stock-adjustments/${adj.id}/approve`}
                                                                    method="post"
                                                                    as="button"
                                                                    className="btn btn-sm btn-soft-success"
                                                                    onBefore={() =>
                                                                        confirm(
                                                                            'Approve this adjustment?',
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
                                            {adjustments.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No adjustments found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                    <Pagination paginator={adjustments} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

StockAdjustmentsIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default StockAdjustmentsIndex;

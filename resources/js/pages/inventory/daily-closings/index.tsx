import { Head, Link, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Alert, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';
import type { DailyClosingIndexPageProps } from '@/types';

function DailyClosingsIndex() {
    const { closings, filters, toast } =
        usePage<DailyClosingIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/daily-closings',
            { search: search || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Daily Closings" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Daily Closings" pageTitle="Inventory" />
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
                                            Daily Closings
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
                                                                '/daily-closings',
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
                                                href="/daily-closings/create"
                                                className="btn btn-success"
                                            >
                                                <i className="ri-add-line me-1 align-bottom"></i>{' '}
                                                Close Day
                                            </Link>
                                        </div>
                                    </div>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Orders</th>
                                                <th>Net Sales</th>
                                                <th>Gross Profit</th>
                                                <th>Net Profit</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {closings.data.map((closing) => (
                                                <tr key={closing.id}>
                                                    <td>
                                                        {closing.closing_date}
                                                    </td>
                                                    <td>
                                                        {closing.total_orders}
                                                    </td>
                                                    <td>
                                                        ${closing.net_sales_usd}
                                                    </td>
                                                    <td>
                                                        $
                                                        {
                                                            closing.gross_profit_usd
                                                        }
                                                    </td>
                                                    <td>
                                                        $
                                                        {closing.net_profit_usd}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge bg-${closing.status === 'closed' ? 'success' : 'secondary'}`}
                                                        >
                                                            {closing.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <Link
                                                            href={`/daily-closings/${closing.id}`}
                                                            className="btn btn-sm btn-soft-primary"
                                                        >
                                                            <i className="ri-eye-line"></i>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                            {closings.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No closings found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                    <Pagination paginator={closings} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

DailyClosingsIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default DailyClosingsIndex;

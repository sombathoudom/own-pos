import { Head, router, usePage } from '@inertiajs/react';
import { type ReactNode, useEffect, useState } from 'react';
import { Badge, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';
import { formatDateTime } from '@/utils/dateTime';

function AuditLogsIndex() {
    const { logs, filters } = usePage<{
        logs: any;
        filters: { search: string; table: string };
    }>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [table, setTable] = useState(filters.table ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
        setTable(filters.table ?? '');
    }, [filters.search, filters.table]);

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/audit-logs',
            { search: search || undefined, table: table || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Audit Logs" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Audit Logs" pageTitle="Inventory" />
                    <Row>
                        <Col xs={12}>
                            <Card>
                                <Card.Body>
                                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 gap-3">
                                        <h4 className="card-title mb-0">
                                            Audit Logs
                                        </h4>
                                        <Form
                                            onSubmit={submit}
                                            className="d-flex gap-2"
                                        >
                                            <Form.Control
                                                type="search"
                                                placeholder="Search action..."
                                                value={search}
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                                style={{ minWidth: 180 }}
                                            />
                                            <Form.Select
                                                value={table}
                                                onChange={(e) =>
                                                    setTable(e.target.value)
                                                }
                                                style={{ minWidth: 150 }}
                                            >
                                                <option value="">
                                                    All Tables
                                                </option>
                                                <option value="sales">
                                                    Sales
                                                </option>
                                                <option value="purchases">
                                                    Purchases
                                                </option>
                                                <option value="products">
                                                    Products
                                                </option>
                                                <option value="stock_adjustments">
                                                    Stock Adjustments
                                                </option>
                                            </Form.Select>
                                            <button
                                                type="submit"
                                                className="btn btn-light"
                                            >
                                                Filter
                                            </button>
                                            {(search || table) && (
                                                <button
                                                    type="button"
                                                    className="btn btn-light"
                                                    onClick={() => {
                                                        setSearch('');
                                                        setTable('');
                                                        router.get(
                                                            '/audit-logs',
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
                                    </div>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>User</th>
                                                <th>Action</th>
                                                <th>Table</th>
                                                <th>Record ID</th>
                                                <th>Changes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.data.map((log: any) => (
                                                <tr key={log.id}>
                                                    <td>
                                                        {formatDateTime(
                                                            log.created_at,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {log.user?.name ??
                                                            'System'}
                                                    </td>
                                                    <td>
                                                        <Badge bg="primary">
                                                            {log.action}
                                                        </Badge>
                                                    </td>
                                                    <td>{log.table_name}</td>
                                                    <td>{log.record_id}</td>
                                                    <td>
                                                        <div className="small text-muted">
                                                            {log.old_values && (
                                                                <div className="text-danger">
                                                                    -{' '}
                                                                    {JSON.stringify(
                                                                        log.old_values,
                                                                    ).slice(
                                                                        0,
                                                                        100,
                                                                    )}
                                                                </div>
                                                            )}
                                                            {log.new_values && (
                                                                <div className="text-success">
                                                                    +{' '}
                                                                    {JSON.stringify(
                                                                        log.new_values,
                                                                    ).slice(
                                                                        0,
                                                                        100,
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {logs.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No audit logs found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                    <Pagination paginator={logs} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

AuditLogsIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default AuditLogsIndex;

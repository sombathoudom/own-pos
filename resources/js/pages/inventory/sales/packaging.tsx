import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode } from 'react';
import { Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';

function SalesPackaging() {
    const { sale } = usePage<{
        sale: { id: number; invoice_no: string; packaging_logs: any[] };
    }>().props;

    const { data, setData, post, processing } = useForm({
        status: 'waiting',
        packed_by: '',
        checked_by: '',
        note: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(`/sales/${sale.id}/packaging`);
    };

    return (
        <>
            <Head title={`Packaging - ${sale.invoice_no}`} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title={`Packaging: ${sale.invoice_no}`}
                        pageTitle="Sales"
                    />
                    <Row>
                        <Col lg={6}>
                            <Card>
                                <Card.Body>
                                    <h5 className="mb-3">
                                        Log Packaging Update
                                    </h5>
                                    <Form onSubmit={submit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Status</Form.Label>
                                            <Form.Select
                                                value={data.status}
                                                onChange={(e) =>
                                                    setData(
                                                        'status',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="waiting">
                                                    Waiting
                                                </option>
                                                <option value="packing">
                                                    Packing
                                                </option>
                                                <option value="packed">
                                                    Packed
                                                </option>
                                                <option value="checked">
                                                    Checked
                                                </option>
                                                <option value="handover_to_delivery">
                                                    Handover to Delivery
                                                </option>
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Packed By (User ID)
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={data.packed_by}
                                                onChange={(e) =>
                                                    setData(
                                                        'packed_by',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Checked By (User ID)
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={data.checked_by}
                                                onChange={(e) =>
                                                    setData(
                                                        'checked_by',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Note</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                value={data.note}
                                                onChange={(e) =>
                                                    setData(
                                                        'note',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
                                        <div className="d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-success"
                                                disabled={processing}
                                            >
                                                Log
                                            </button>
                                            <Link
                                                href={`/sales/${sale.id}`}
                                                className="btn btn-light"
                                            >
                                                Cancel
                                            </Link>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={6}>
                            <Card>
                                <Card.Body>
                                    <h5 className="mb-3">Packaging History</h5>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                                <th>Packed By</th>
                                                <th>Packed At</th>
                                                <th>Checked By</th>
                                                <th>Note</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sale.packaging_logs.map((log) => (
                                                <tr key={log.id}>
                                                    <td>
                                                        <span
                                                            className={`badge bg-${log.status === 'checked' ? 'success' : log.status === 'packed' ? 'primary' : 'secondary'}`}
                                                        >
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {log.packed_by ?? '-'}
                                                    </td>
                                                    <td>
                                                        {log.packed_at ?? '-'}
                                                    </td>
                                                    <td>
                                                        {log.checked_by ?? '-'}
                                                    </td>
                                                    <td>{log.note ?? '-'}</td>
                                                </tr>
                                            ))}
                                            {sale.packaging_logs.length ===
                                                0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="text-center text-muted"
                                                    >
                                                        No logs.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

SalesPackaging.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default SalesPackaging;

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
import { create, destroy, edit, index } from '@/routes/delivery-companies';
import type { DeliveryCompanyIndexPageProps } from '@/types';

function DeliveryCompaniesIndex() {
    const { companies, filters, toast } =
        usePage<DeliveryCompanyIndexPageProps>().props;

    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            index.url(),
            { search: search || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Delivery Companies" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Delivery Companies"
                        pageTitle="Inventory"
                    />

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
                        <Col xs={12}>
                            <Card>
                                <Card.Body>
                                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 gap-3">
                                        <h4 className="card-title mb-0">
                                            Delivery Companies
                                        </h4>

                                        <div className="d-flex flex-wrap gap-2">
                                            <Form
                                                onSubmit={handleSearch}
                                                className="d-flex gap-2"
                                            >
                                                <Form.Control
                                                    type="search"
                                                    placeholder="Search companies..."
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
                                                                index.url(),
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
                                                href={create.url()}
                                                className="btn btn-success"
                                            >
                                                <i className="ri-add-line me-1 align-bottom"></i>
                                                Add Company
                                            </Link>
                                        </div>
                                    </div>

                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Delivery Cost</th>
                                                <th>Status</th>
                                                <th>Note</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {companies.data.map((company) => (
                                                <tr key={company.id}>
                                                    <td className="fw-semibold">
                                                        {company.name}
                                                    </td>
                                                    <td>
                                                        <span className="fw-bold text-primary">
                                                            $
                                                            {Number(
                                                                company.delivery_cost_usd,
                                                            ).toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg={
                                                                company.status ===
                                                                'active'
                                                                    ? 'success'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {company.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="small text-muted">
                                                        {company.note || '—'}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <Link
                                                                href={edit.url({
                                                                    delivery_company:
                                                                        company.id,
                                                                })}
                                                                className="btn btn-sm btn-soft-primary"
                                                            >
                                                                <i className="ri-pencil-line"></i>
                                                            </Link>
                                                            <Link
                                                                href={destroy.url(
                                                                    {
                                                                        delivery_company:
                                                                            company.id,
                                                                    },
                                                                )}
                                                                method="delete"
                                                                as="button"
                                                                className="btn btn-sm btn-soft-danger"
                                                                onBefore={() =>
                                                                    confirm(
                                                                        'Delete this delivery company?',
                                                                    )
                                                                }
                                                            >
                                                                <i className="ri-delete-bin-line"></i>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {companies.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No delivery companies
                                                        found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>

                                    <Pagination paginator={companies} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

DeliveryCompaniesIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default DeliveryCompaniesIndex;

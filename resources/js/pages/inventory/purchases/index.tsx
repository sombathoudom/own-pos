import { Head, Link, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Container,
    Form,
    Table,
} from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';
import {
    create as purchasesCreate,
    index as purchasesIndex,
    show as purchasesShow,
} from '@/routes/purchases';
import type { PurchaseIndexPageProps } from '@/types';

function PurchasesIndex() {
    const { purchases, filters, toast } =
        usePage<PurchaseIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            purchasesIndex.url(),
            { search: search || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    const statusBadge = (status: string) => {
        if (status === 'in_transit')
            return <Badge bg="warning">In Transit</Badge>;
        if (status === 'arrived') return <Badge bg="success">Arrived</Badge>;
        if (status === 'draft') return <Badge bg="secondary">Draft</Badge>;
        if (status === 'confirmed')
            return <Badge bg="success">Confirmed</Badge>;
        return <Badge bg="secondary">{status}</Badge>;
    };

    return (
        <>
            <Head title="Purchases" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Purchases" pageTitle="Inventory" />

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

                    <Card>
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <Form
                                    onSubmit={handleSearch}
                                    className="d-flex gap-2"
                                    style={{ maxWidth: 400 }}
                                >
                                    <Form.Control
                                        placeholder="Search purchase #..."
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                    />
                                    <Button type="submit" variant="primary">
                                        Search
                                    </Button>
                                    {search && (
                                        <Button
                                            type="button"
                                            variant="light"
                                            onClick={() => {
                                                setSearch('');
                                                router.get(
                                                    purchasesIndex.url(),
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
                                    href={purchasesCreate.url()}
                                    className="btn btn-success"
                                >
                                    New Purchase
                                </Link>
                            </div>

                            <Table
                                responsive
                                striped
                                hover
                                className="align-middle"
                            >
                                <thead>
                                    <tr>
                                        <th>Purchase #</th>
                                        <th>Date</th>
                                        <th>Supplier</th>
                                        <th>Total Cost</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchases.data.map((purchase) => (
                                        <tr key={purchase.id}>
                                            <td>{purchase.purchase_no}</td>
                                            <td>{purchase.purchase_date}</td>
                                            <td>
                                                {purchase.supplier?.name || '—'}
                                            </td>
                                            <td>
                                                $
                                                {Number(
                                                    purchase.total_cost_usd ||
                                                        0,
                                                ).toFixed(2)}
                                            </td>
                                            <td>
                                                {statusBadge(purchase.status)}
                                            </td>
                                            <td>
                                                <Link
                                                    href={purchasesShow.url({
                                                        purchase: purchase.id,
                                                    })}
                                                    className="btn btn-sm btn-outline-primary"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {purchases.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="text-center text-muted"
                                            >
                                                No purchases found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>

                            <Pagination paginator={purchases} />
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        </>
    );
}

PurchasesIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default PurchasesIndex;

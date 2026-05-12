import { Head, Link, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Button, Card, Container, Form, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';
import {
    index as stockIndex,
    movements as stockMovements,
} from '@/routes/stock';
import type { StockIndexPageProps } from '@/types';

function StockIndex() {
    const { variants, filters } = usePage<StockIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            stockIndex.url(),
            { search: search || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Stock Balances" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Stock" pageTitle="Inventory" />

                    <Card>
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <Form
                                    onSubmit={handleSearch}
                                    className="d-flex gap-2"
                                    style={{ maxWidth: 400 }}
                                >
                                    <Form.Control
                                        placeholder="Search SKU, product, color, size..."
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
                                                    stockIndex.url(),
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
                                    href={stockMovements.url()}
                                    className="btn btn-outline-primary"
                                >
                                    Stock Movements
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
                                        <th>SKU</th>
                                        <th>Product</th>
                                        <th>Color</th>
                                        <th>Size</th>
                                        <th>Qty On Hand</th>
                                        <th>Sale Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.data.map((variant) => (
                                        <tr key={variant.id}>
                                            <td>{variant.sku}</td>
                                            <td>
                                                {variant.product?.name || '—'}
                                            </td>
                                            <td>{variant.color || '—'}</td>
                                            <td>{variant.size || '—'}</td>
                                            <td>
                                                {variant.stockBalance
                                                    ?.qty_on_hand ?? 0}
                                            </td>
                                            <td>
                                                $
                                                {Number(
                                                    variant.sale_price_usd,
                                                ).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {variants.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="text-center text-muted"
                                            >
                                                No stock entries found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>

                            <Pagination paginator={variants} />
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        </>
    );
}

StockIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default StockIndex;

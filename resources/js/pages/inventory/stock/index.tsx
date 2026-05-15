import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    type FormEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    Badge,
    Button,
    Card,
    Container,
    Form,
    Row,
    Table,
} from 'react-bootstrap';

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

    const stats = useMemo(() => {
        const data = variants.data;
        const totalSkus = data.length;
        const totalQty = data.reduce(
            (sum, v) => sum + (v.stockBalance?.qty_on_hand ?? 0),
            0,
        );
        const outOfStock = data.filter(
            (v) => (v.stockBalance?.qty_on_hand ?? 0) === 0,
        ).length;
        const lowStock = data.filter((v) => {
            const qty = v.stockBalance?.qty_on_hand ?? 0;
            return qty > 0 && qty <= 5;
        }).length;

        return { totalSkus, totalQty, outOfStock, lowStock };
    }, [variants.data]);

    const stockBadge = (qty: number) => {
        if (qty === 0) return <Badge bg="danger">Out of Stock</Badge>;
        if (qty <= 5) return <Badge bg="warning">Low: {qty}</Badge>;
        return <Badge bg="success">In Stock: {qty}</Badge>;
    };

    return (
        <>
            <Head title="Stock Balances" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Stock" pageTitle="Inventory" />

                    <Row className="g-3 mb-3">
                        <div className="col-md-3">
                            <Card className="h-100">
                                <Card.Body className="d-flex align-items-center gap-3">
                                    <div className="avatar-sm bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center bg-primary">
                                        <i className="ri-archive-line fs-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="mb-0 text-muted">
                                            Total SKUs
                                        </p>
                                        <h5 className="mb-0">
                                            {stats.totalSkus}
                                        </h5>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                        <div className="col-md-3">
                            <Card className="h-100">
                                <Card.Body className="d-flex align-items-center gap-3">
                                    <div className="avatar-sm bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                                        <i className="ri-stack-line text-success fs-4" />
                                    </div>
                                    <div>
                                        <p className="mb-0 text-muted">
                                            Total Quantity
                                        </p>
                                        <h5 className="mb-0">
                                            {stats.totalQty}
                                        </h5>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                        <div className="col-md-3">
                            <Card className="h-100">
                                <Card.Body className="d-flex align-items-center gap-3">
                                    <div className="avatar-sm bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                                        <i className="ri-error-warning-line text-warning fs-4" />
                                    </div>
                                    <div>
                                        <p className="mb-0 text-muted">
                                            Low Stock
                                        </p>
                                        <h5 className="mb-0">
                                            {stats.lowStock}
                                        </h5>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                        <div className="col-md-3">
                            <Card className="h-100">
                                <Card.Body className="d-flex align-items-center gap-3">
                                    <div className="avatar-sm bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center">
                                        <i className="ri-close-circle-line text-danger fs-4" />
                                    </div>
                                    <div>
                                        <p className="mb-0 text-muted">
                                            Out of Stock
                                        </p>
                                        <h5 className="mb-0">
                                            {stats.outOfStock}
                                        </h5>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    </Row>

                    <Card>
                        <Card.Header className="d-flex align-items-center justify-content-between">
                            <h5 className="card-title mb-0">Stock Balances</h5>
                            <Link
                                href={stockMovements.url()}
                                className="btn btn-sm btn-outline-primary"
                            >
                                <i className="ri-arrow-left-right-line me-1" />
                                Stock Movements
                            </Link>
                        </Card.Header>
                        <Card.Body>
                            <Form
                                onSubmit={handleSearch}
                                className="d-flex mb-3 gap-2"
                                style={{ maxWidth: 500 }}
                            >
                                <div className="position-relative flex-grow-1">
                                    <i className="ri-search-line position-absolute translate-middle-y start-0 top-50 ms-3 text-muted" />
                                    <Form.Control
                                        placeholder="Search SKU, product name, color, size..."
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        className="ps-5"
                                    />
                                </div>
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

                            <div className="table-responsive">
                                <Table
                                    hover
                                    className="table-nowrap align-middle"
                                >
                                    <thead className="table-light">
                                        <tr>
                                            <th>SKU</th>
                                            <th>Product</th>
                                            <th>Variant</th>
                                            <th className="text-end">
                                                Qty On Hand
                                            </th>
                                            <th className="text-end">
                                                Sale Price
                                            </th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variants.data.map((variant) => (
                                            <tr key={variant.id}>
                                                <td>
                                                    <span className="fw-medium">
                                                        {variant.sku}
                                                    </span>
                                                </td>
                                                <td>
                                                    {variant.product?.name ||
                                                        '—'}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        {variant.color && (
                                                            <Badge
                                                                bg="info"
                                                                className="fw-normal"
                                                            >
                                                                {variant.color}
                                                            </Badge>
                                                        )}
                                                        {variant.size && (
                                                            <Badge
                                                                bg="secondary"
                                                                className="fw-normal"
                                                            >
                                                                {variant.size}
                                                            </Badge>
                                                        )}
                                                        {!variant.color &&
                                                            !variant.size &&
                                                            '—'}
                                                    </div>
                                                </td>
                                                <td className="fw-medium text-end">
                                                    {variant.stockBalance
                                                        ?.qty_on_hand ?? 0}
                                                </td>
                                                <td className="text-end">
                                                    $
                                                    {Number(
                                                        variant.sale_price_usd,
                                                    ).toFixed(2)}
                                                </td>
                                                <td>
                                                    {stockBadge(
                                                        variant.stockBalance
                                                            ?.qty_on_hand ?? 0,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {variants.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="py-4 text-center text-muted"
                                                >
                                                    <i className="ri-inbox-line fs-2 d-block mb-2" />
                                                    No stock entries found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

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

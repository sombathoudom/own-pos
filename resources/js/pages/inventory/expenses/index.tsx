import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Alert, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';
import {
    create as expensesCreate,
    destroy as expensesDestroy,
    edit as expensesEdit,
    index as expensesIndex,
} from '@/routes/expenses';
import type { ExpenseIndexPageProps } from '@/types';
import { formatDate } from '@/utils/dateTime';

function ExpensesIndex() {
    const { expenses, filters, toast } = usePage<ExpenseIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [from, setFrom] = useState(filters.date_from ?? '');
    const [to, setTo] = useState(filters.date_to ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
        setFrom(filters.date_from ?? '');
        setTo(filters.date_to ?? '');
    }, [filters.search, filters.date_from, filters.date_to]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            expensesIndex.url(),
            {
                search: search || undefined,
                from: from || undefined,
                to: to || undefined,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setFrom('');
        setTo('');
        router.get(
            expensesIndex.url(),
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const hasFilters = search || from || to;

    const categoryLabel = (cat: string) =>
        cat.charAt(0).toUpperCase() + cat.slice(1);

    return (
        <>
            <Head title="Expenses" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Expenses" pageTitle="Inventory" />
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
                                    <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between mb-3 gap-3">
                                        <h4 className="card-title mb-0">
                                            Expenses
                                        </h4>
                                        <div className="d-flex align-items-start flex-wrap gap-2">
                                            <Form
                                                onSubmit={submit}
                                                className="d-flex flex-wrap gap-2"
                                            >
                                                <Form.Control
                                                    type="search"
                                                    placeholder="Search category..."
                                                    value={search}
                                                    onChange={(e) =>
                                                        setSearch(
                                                            e.target.value,
                                                        )
                                                    }
                                                    style={{ width: 180 }}
                                                />
                                                <Form.Control
                                                    type="date"
                                                    value={from}
                                                    onChange={(e) =>
                                                        setFrom(e.target.value)
                                                    }
                                                    title="From date"
                                                    style={{ width: 150 }}
                                                />
                                                <Form.Control
                                                    type="date"
                                                    value={to}
                                                    onChange={(e) =>
                                                        setTo(e.target.value)
                                                    }
                                                    title="To date"
                                                    style={{ width: 150 }}
                                                />
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                >
                                                    <i className="ri-filter-search-line me-1"></i>
                                                    Filter
                                                </button>
                                                {hasFilters && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-light"
                                                        onClick={clearFilters}
                                                    >
                                                        <i className="ri-close-circle-line me-1"></i>
                                                        Clear
                                                    </button>
                                                )}
                                            </Form>
                                            <Link
                                                href={expensesCreate.url()}
                                                className="btn btn-success"
                                            >
                                                <i className="ri-add-line me-1 align-bottom"></i>
                                                Add Expense
                                            </Link>
                                        </div>
                                    </div>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Category</th>
                                                <th className="text-end">
                                                    Amount (USD)
                                                </th>
                                                <th className="text-end">
                                                    Amount (KHR)
                                                </th>
                                                <th>Currency</th>
                                                <th>Note</th>
                                                <th className="text-end">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expenses.data.map((expense) => (
                                                <tr key={expense.id}>
                                                    <td>
                                                        {formatDate(
                                                            expense.expense_date,
                                                            'long',
                                                        )}
                                                    </td>
                                                    <td>
                                                        {categoryLabel(
                                                            expense.category,
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        ${expense.amount_usd}
                                                    </td>
                                                    <td className="text-end">
                                                        {expense.amount_khr
                                                            ? `${expense.amount_khr} ៛`
                                                            : '-'}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge bg-${expense.currency === 'USD' ? 'primary' : 'info'}`}
                                                        >
                                                            {expense.currency}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {expense.note ?? '-'}
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-flex justify-content-end gap-1">
                                                            <Link
                                                                href={expensesEdit.url(
                                                                    expense.id,
                                                                )}
                                                                className="btn btn-sm btn-soft-primary"
                                                            >
                                                                <i className="ri-pencil-line"></i>
                                                            </Link>
                                                            <Link
                                                                href={expensesDestroy.url(
                                                                    expense.id,
                                                                )}
                                                                method="delete"
                                                                as="button"
                                                                className="btn btn-sm btn-soft-danger"
                                                                onBefore={() =>
                                                                    confirm(
                                                                        'Delete this expense?',
                                                                    )
                                                                }
                                                            >
                                                                <i className="ri-delete-bin-line"></i>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {expenses.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        <i className="ri-inbox-line fs-2 d-block mb-2" />
                                                        No expenses found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                    <Pagination paginator={expenses} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

ExpensesIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ExpensesIndex;

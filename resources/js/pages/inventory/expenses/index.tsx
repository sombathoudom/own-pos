import { Head, Link, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Alert, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';
import {
    create as expensesCreate,
    index as expensesIndex,
} from '@/routes/expenses';
import type { ExpenseIndexPageProps } from '@/types';

function ExpensesIndex() {
    const { expenses, filters, toast } = usePage<ExpenseIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            expensesIndex.url(),
            { search: search || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

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
                                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 gap-3">
                                        <h4 className="card-title mb-0">
                                            Expenses
                                        </h4>
                                        <div className="d-flex flex-wrap gap-2">
                                            <Form
                                                onSubmit={submit}
                                                className="d-flex gap-2"
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
                                                                expensesIndex.url(),
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
                                                href={expensesCreate.url()}
                                                className="btn btn-success"
                                            >
                                                <i className="ri-add-line me-1 align-bottom"></i>{' '}
                                                Add Expense
                                            </Link>
                                        </div>
                                    </div>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Category</th>
                                                <th>Amount (USD)</th>
                                                <th>Currency</th>
                                                <th>Note</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expenses.data.map((expense) => (
                                                <tr key={expense.id}>
                                                    <td>
                                                        {expense.expense_date}
                                                    </td>
                                                    <td>{expense.category}</td>
                                                    <td>
                                                        ${expense.amount_usd}
                                                    </td>
                                                    <td>{expense.currency}</td>
                                                    <td>
                                                        {expense.note ?? '-'}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <Link
                                                                href={`/expenses/${expense.id}/edit`}
                                                                className="btn btn-sm btn-soft-primary"
                                                            >
                                                                <i className="ri-pencil-line"></i>
                                                            </Link>
                                                            <Link
                                                                href={`/expenses/${expense.id}`}
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
                                                        colSpan={6}
                                                        className="py-4 text-center text-muted"
                                                    >
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

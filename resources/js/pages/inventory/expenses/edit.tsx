import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode } from 'react';
import { Card, Col, Container, Form, Row } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { index as expensesIndex } from '@/routes/expenses';
import type { InventoryExpense } from '@/types';

function ExpensesEdit() {
    const { expense } = usePage<{ expense: InventoryExpense }>().props;
    const { data, setData, put, processing, errors } = useForm({
        expense_date: expense.expense_date,
        category: expense.category,
        amount_usd: expense.amount_usd,
        amount_khr: expense.amount_khr,
        currency: expense.currency,
        exchange_rate: expense.exchange_rate,
        note: expense.note ?? '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(`/expenses/${expense.id}`);
    };

    const categories = [
        'ads',
        'delivery',
        'packaging',
        'staff',
        'rent',
        'transport',
        'phone',
        'internet',
        'other',
    ];

    return (
        <>
            <Head title="Edit Expense" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Edit Expense" pageTitle="Inventory" />
                    <Row>
                        <Col lg={6}>
                            <Card>
                                <Card.Body>
                                    <Form onSubmit={submit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={data.expense_date}
                                                onChange={(e) =>
                                                    setData(
                                                        'expense_date',
                                                        e.target.value,
                                                    )
                                                }
                                                isInvalid={
                                                    !!errors.expense_date
                                                }
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.expense_date}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Category</Form.Label>
                                            <Form.Select
                                                value={data.category}
                                                onChange={(e) =>
                                                    setData(
                                                        'category',
                                                        e.target.value,
                                                    )
                                                }
                                                isInvalid={!!errors.category}
                                            >
                                                {categories.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Amount (USD)
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                value={data.amount_usd}
                                                onChange={(e) =>
                                                    setData(
                                                        'amount_usd',
                                                        e.target.value,
                                                    )
                                                }
                                                isInvalid={!!errors.amount_usd}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.amount_usd}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Amount (KHR)
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="1"
                                                value={data.amount_khr}
                                                onChange={(e) =>
                                                    setData(
                                                        'amount_khr',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Currency</Form.Label>
                                            <Form.Select
                                                value={data.currency}
                                                onChange={(e) =>
                                                    setData(
                                                        'currency',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="USD">USD</option>
                                                <option value="KHR">KHR</option>
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Exchange Rate
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.0001"
                                                value={data.exchange_rate}
                                                onChange={(e) =>
                                                    setData(
                                                        'exchange_rate',
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
                                                Update
                                            </button>
                                            <Link
                                                href={expensesIndex.url()}
                                                className="btn btn-light"
                                            >
                                                Cancel
                                            </Link>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

ExpensesEdit.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ExpensesEdit;

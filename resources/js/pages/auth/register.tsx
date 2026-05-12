import { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

import GuestLayout from '@/Layouts/GuestLayout';
import { login as loginPage } from '@/routes';
import { store as registerStore } from '@/routes/register';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, [reset]);

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(registerStore.url());
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="auth-page-content mt-lg-5">
                <Container>
                    <Row>
                        <Col lg={12}>
                            <div className="mt-sm-5 text-white-50 mb-4 text-center">
                                <Link
                                    href={loginPage()}
                                    className="d-inline-block auth-logo"
                                >
                                    <span className="fs-3 fw-semibold text-white">
                                        Wifey POS
                                    </span>
                                </Link>
                                <p className="fs-15 fw-medium mt-3">
                                    Create your Velzon-powered workspace account
                                </p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="justify-content-center">
                        <Col md={8} lg={6} xl={5}>
                            <Card className="mt-4">
                                <Card.Body className="p-4">
                                    <div className="mt-2 text-center">
                                        <h5 className="text-primary">
                                            Create a new account
                                        </h5>
                                        <p className="text-muted">
                                            Start with a clean Velzon minimal
                                            setup.
                                        </p>
                                    </div>

                                    <div className="mt-4 p-2">
                                        <Form onSubmit={submit}>
                                            <div className="mb-3">
                                                <Form.Label
                                                    htmlFor="name"
                                                    className="form-label"
                                                >
                                                    Full name
                                                </Form.Label>
                                                <Form.Control
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(event) =>
                                                        setData(
                                                            'name',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={
                                                        errors.name
                                                            ? 'is-invalid'
                                                            : ''
                                                    }
                                                    autoComplete="name"
                                                    required
                                                />
                                                <Form.Control.Feedback
                                                    type="invalid"
                                                    className="d-block"
                                                >
                                                    {errors.name}
                                                </Form.Control.Feedback>
                                            </div>

                                            <div className="mb-3">
                                                <Form.Label
                                                    htmlFor="email"
                                                    className="form-label"
                                                >
                                                    Email
                                                </Form.Label>
                                                <Form.Control
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(event) =>
                                                        setData(
                                                            'email',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={
                                                        errors.email
                                                            ? 'is-invalid'
                                                            : ''
                                                    }
                                                    autoComplete="username"
                                                    required
                                                />
                                                <Form.Control.Feedback
                                                    type="invalid"
                                                    className="d-block"
                                                >
                                                    {errors.email}
                                                </Form.Control.Feedback>
                                            </div>

                                            <div className="mb-3">
                                                <Form.Label
                                                    htmlFor="password"
                                                    className="form-label"
                                                >
                                                    Password
                                                </Form.Label>
                                                <Form.Control
                                                    id="password"
                                                    type="password"
                                                    value={data.password}
                                                    onChange={(event) =>
                                                        setData(
                                                            'password',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={
                                                        errors.password
                                                            ? 'is-invalid'
                                                            : ''
                                                    }
                                                    autoComplete="new-password"
                                                    required
                                                />
                                                <Form.Control.Feedback
                                                    type="invalid"
                                                    className="d-block"
                                                >
                                                    {errors.password}
                                                </Form.Control.Feedback>
                                            </div>

                                            <div className="mb-4">
                                                <Form.Label
                                                    htmlFor="password_confirmation"
                                                    className="form-label"
                                                >
                                                    Confirm password
                                                </Form.Label>
                                                <Form.Control
                                                    id="password_confirmation"
                                                    type="password"
                                                    value={
                                                        data.password_confirmation
                                                    }
                                                    onChange={(event) =>
                                                        setData(
                                                            'password_confirmation',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={
                                                        errors.password_confirmation
                                                            ? 'is-invalid'
                                                            : ''
                                                    }
                                                    autoComplete="new-password"
                                                    required
                                                />
                                                <Form.Control.Feedback
                                                    type="invalid"
                                                    className="d-block"
                                                >
                                                    {
                                                        errors.password_confirmation
                                                    }
                                                </Form.Control.Feedback>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="btn btn-success w-100"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Creating account...'
                                                    : 'Create account'}
                                            </Button>
                                        </Form>
                                    </div>
                                </Card.Body>
                            </Card>

                            <div className="mt-4 text-center">
                                <p className="mb-0">
                                    Already have an account?{' '}
                                    <Link
                                        href={loginPage()}
                                        className="fw-semibold text-decoration-underline text-primary"
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </GuestLayout>
    );
}

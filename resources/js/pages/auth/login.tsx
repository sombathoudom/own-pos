import { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

import GuestLayout from '@/Layouts/GuestLayout';
import { login as loginPage, register as registerPage } from '@/routes';
import { store as loginStore } from '@/routes/login';
import { request as forgotPassword } from '@/routes/password';

type LoginProps = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: LoginProps) {
    const [passwordShown, setPasswordShown] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, [reset]);

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(loginStore.url());
    };

    return (
        <GuestLayout>
            <Head title="Sign In" />

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
                                    Minimal admin experience powered by Velzon
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
                                            Welcome back
                                        </h5>
                                        <p className="text-muted">
                                            Sign in to continue to your
                                            workspace.
                                        </p>
                                    </div>

                                    {status && (
                                        <div className="alert alert-success mt-4 mb-0">
                                            {status}
                                        </div>
                                    )}

                                    <div className="mt-4 p-2">
                                        <Form onSubmit={submit}>
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
                                                    autoFocus
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
                                                <div className="float-end">
                                                    {canResetPassword && (
                                                        <Link
                                                            href={forgotPassword()}
                                                            className="text-muted"
                                                        >
                                                            Forgot password?
                                                        </Link>
                                                    )}
                                                </div>

                                                <Form.Label
                                                    htmlFor="password"
                                                    className="form-label"
                                                >
                                                    Password
                                                </Form.Label>
                                                <div className="position-relative auth-pass-inputgroup mb-3">
                                                    <Form.Control
                                                        id="password"
                                                        type={
                                                            passwordShown
                                                                ? 'text'
                                                                : 'password'
                                                        }
                                                        value={data.password}
                                                        onChange={(event) =>
                                                            setData(
                                                                'password',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className={
                                                            errors.password
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                        autoComplete="current-password"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-link position-absolute text-decoration-none end-0 top-0 text-muted"
                                                        onClick={() =>
                                                            setPasswordShown(
                                                                (shown) =>
                                                                    !shown,
                                                            )
                                                        }
                                                    >
                                                        <i className="ri-eye-fill align-middle"></i>
                                                    </button>
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.password}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </div>

                                            <Form.Check
                                                id="remember"
                                                className="mb-4"
                                                label="Remember me"
                                                checked={data.remember}
                                                onChange={(event) =>
                                                    setData(
                                                        'remember',
                                                        event.target.checked,
                                                    )
                                                }
                                            />

                                            <Button
                                                type="submit"
                                                className="btn btn-success w-100"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Signing in...'
                                                    : 'Sign in'}
                                            </Button>
                                        </Form>
                                    </div>
                                </Card.Body>
                            </Card>

                            <div className="mt-4 text-center">
                                <p className="mb-0">
                                    Don&apos;t have an account?{' '}
                                    <Link
                                        href={registerPage()}
                                        className="fw-semibold text-decoration-underline text-primary"
                                    >
                                        Sign up
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

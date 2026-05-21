import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

import GuestLayout from '@/Layouts/GuestLayout';
import { login as loginPage } from '@/routes';
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
            <Head title="Sign In — Doly Outfits" />

            <div className="auth-page-content mt-lg-5">
                <Container>
                    <Row>
                        <Col lg={12}>
                            <div className="mt-sm-5 text-white-50 mb-4 text-center">
                                <div className="mb-3">
                                    <span
                                        className="fs-1 fw-bold text-white d-block"
                                        style={{ letterSpacing: 2 }}
                                    >
                                        DOLY OUTFITS
                                    </span>
                                    <span
                                        className="text-white-50"
                                        style={{
                                            fontSize: '0.85rem',
                                            letterSpacing: 4,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Point of Sale System
                                    </span>
                                </div>
                                <p
                                    className="fs-15 fw-medium mt-3"
                                    style={{ maxWidth: 400, margin: '0 auto' }}
                                >
                                    Welcome back. Sign in to manage your boutique
                                    sales, inventory, and daily operations.
                                </p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="justify-content-center">
                        <Col md={8} lg={5} xl={4}>
                            <Card
                                className="mt-4 border-0 shadow-lg"
                                style={{
                                    background:
                                        'rgba(255, 255, 255, 0.97)',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <Card.Body className="p-4 p-md-5">
                                    <div className="text-center mb-4">
                                        <div
                                            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                            style={{
                                                width: 56,
                                                height: 56,
                                                background:
                                                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            }}
                                        >
                                            <i className="ri-store-2-line fs-3 text-white"></i>
                                        </div>
                                        <h5
                                            className="mb-1"
                                            style={{
                                                fontWeight: 700,
                                                color: '#2d3748',
                                            }}
                                        >
                                            Staff Sign In
                                        </h5>
                                        <p
                                            className="text-muted mb-0"
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            Enter your credentials to access the
                                            POS.
                                        </p>
                                    </div>

                                    {status && (
                                        <div className="alert alert-success alert-dismissible fade show mt-3 mb-0 py-2">
                                            <i className="ri-checkbox-circle-line me-1"></i>
                                            {status}
                                        </div>
                                    )}

                                    <Form onSubmit={submit} className="mt-4">
                                        <div className="mb-3">
                                            <Form.Label
                                                htmlFor="email"
                                                className="small fw-semibold text-muted"
                                            >
                                                Email address
                                            </Form.Label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0">
                                                    <i className="ri-mail-line text-muted"></i>
                                                </span>
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
                                                    className={`border-start-0 ${errors.email ? 'is-invalid' : ''}`}
                                                    placeholder="you@dolyoutfits.com"
                                                    autoComplete="username"
                                                    autoFocus
                                                    required
                                                />
                                            </div>
                                            <Form.Control.Feedback
                                                type="invalid"
                                                className="d-block"
                                            >
                                                {errors.email}
                                            </Form.Control.Feedback>
                                        </div>

                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <Form.Label
                                                    htmlFor="password"
                                                    className="small fw-semibold text-muted mb-0"
                                                >
                                                    Password
                                                </Form.Label>
                                                {canResetPassword && (
                                                    <Link
                                                        href={forgotPassword()}
                                                        className="small text-decoration-none"
                                                        style={{
                                                            color: '#667eea',
                                                        }}
                                                    >
                                                        Forgot password?
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-end-0">
                                                    <i className="ri-lock-password-line text-muted"></i>
                                                </span>
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
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={`border-start-0 ${errors.password ? 'is-invalid' : ''}`}
                                                    placeholder="Enter your password"
                                                    autoComplete="current-password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-link position-absolute text-decoration-none end-0 top-0 text-muted"
                                                    style={{ zIndex: 5 }}
                                                    onClick={() =>
                                                        setPasswordShown(
                                                            (shown) => !shown,
                                                        )
                                                    }
                                                >
                                                    <i
                                                        className={`ri-${passwordShown ? 'eye-off' : 'eye'}-line align-middle`}
                                                    ></i>
                                                </button>
                                            </div>
                                            <Form.Control.Feedback
                                                type="invalid"
                                                className="d-block"
                                            >
                                                {errors.password}
                                            </Form.Control.Feedback>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <Form.Check
                                                id="remember"
                                                className="small"
                                                label="Keep me signed in"
                                                checked={data.remember}
                                                onChange={(event) =>
                                                    setData(
                                                        'remember',
                                                        event.target.checked,
                                                    )
                                                }
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-100 py-2"
                                            disabled={processing}
                                            style={{
                                                background:
                                                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                border: 'none',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {processing ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        role="status"
                                                        aria-hidden="true"
                                                    ></span>
                                                    Signing in...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-login-box-line me-2"></i>
                                                    Sign In
                                                </>
                                            )}
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>

                            <div className="mt-4 text-center">
                                <p className="mb-0 text-white-50">
                                    <i className="ri-shield-check-line me-1"></i>
                                    Secure staff-only access
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </GuestLayout>
    );
}

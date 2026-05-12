import { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

import GuestLayout from '@/Layouts/GuestLayout';
import { dashboard, login as loginPage } from '@/routes';
import { store as confirmPasswordStore } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, [reset]);

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(confirmPasswordStore.url());
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="auth-page-content mt-lg-5">
                <Container>
                    <Row>
                        <Col lg={12}>
                            <div className="mt-sm-5 text-white-50 mb-4 text-center">
                                <Link
                                    href={dashboard()}
                                    className="d-inline-block auth-logo"
                                >
                                    <span className="fs-3 fw-semibold text-white">
                                        Wifey POS
                                    </span>
                                </Link>
                                <p className="fs-15 fw-medium mt-3">
                                    Confirm your password to continue
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
                                            Security check
                                        </h5>
                                        <p className="text-muted">
                                            Please re-enter your password before
                                            accessing this section.
                                        </p>
                                    </div>

                                    <div className="mt-4 p-2">
                                        <Form onSubmit={submit}>
                                            <div className="mb-4">
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
                                                    autoFocus
                                                    required
                                                />
                                                <Form.Control.Feedback
                                                    type="invalid"
                                                    className="d-block"
                                                >
                                                    {errors.password}
                                                </Form.Control.Feedback>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="btn btn-success w-100"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Confirming...'
                                                    : 'Confirm password'}
                                            </Button>
                                        </Form>
                                    </div>
                                </Card.Body>
                            </Card>

                            <div className="mt-4 text-center">
                                <p className="mb-0">
                                    Not you?{' '}
                                    <Link
                                        href={loginPage()}
                                        className="fw-semibold text-decoration-underline text-primary"
                                    >
                                        Return to sign in
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

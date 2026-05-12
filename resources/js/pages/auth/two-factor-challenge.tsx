import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

import GuestLayout from '@/Layouts/GuestLayout';
import { login as loginPage } from '@/routes';
import { store as submitTwoFactor } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [usingRecoveryCode, setUsingRecoveryCode] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        recovery_code: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(submitTwoFactor.url(), {
            onFinish: () => reset('code', 'recovery_code'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Two-Factor Challenge" />

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
                                    Complete your secure sign-in
                                </p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="justify-content-center">
                        <Col md={8} lg={6} xl={5}>
                            <Card className="mt-4">
                                <Card.Body className="p-4">
                                    <div className="mt-2 mb-4 text-center">
                                        <h5 className="text-primary">
                                            Two-factor authentication
                                        </h5>
                                        <p className="mb-0 text-muted">
                                            {usingRecoveryCode
                                                ? 'Enter one of your recovery codes.'
                                                : 'Enter the six-digit code from your authenticator app.'}
                                        </p>
                                    </div>

                                    <Form onSubmit={submit}>
                                        {usingRecoveryCode ? (
                                            <div className="mb-4">
                                                <Form.Label
                                                    htmlFor="recovery_code"
                                                    className="form-label"
                                                >
                                                    Recovery code
                                                </Form.Label>
                                                <Form.Control
                                                    id="recovery_code"
                                                    value={data.recovery_code}
                                                    onChange={(event) =>
                                                        setData(
                                                            'recovery_code',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={
                                                        errors.recovery_code
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
                                                    {errors.recovery_code}
                                                </Form.Control.Feedback>
                                            </div>
                                        ) : (
                                            <div className="mb-4">
                                                <Form.Label
                                                    htmlFor="code"
                                                    className="form-label"
                                                >
                                                    Authentication code
                                                </Form.Label>
                                                <Form.Control
                                                    id="code"
                                                    inputMode="numeric"
                                                    value={data.code}
                                                    onChange={(event) =>
                                                        setData(
                                                            'code',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={
                                                        errors.code
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
                                                    {errors.code}
                                                </Form.Control.Feedback>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="btn btn-success w-100"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Verifying...'
                                                : 'Continue'}
                                        </Button>
                                    </Form>

                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            className="btn btn-link text-decoration-none"
                                            onClick={() => {
                                                setUsingRecoveryCode(
                                                    (value) => !value,
                                                );
                                                reset('code', 'recovery_code');
                                            }}
                                        >
                                            {usingRecoveryCode
                                                ? 'Use an authentication code instead'
                                                : 'Use a recovery code instead'}
                                        </button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </GuestLayout>
    );
}

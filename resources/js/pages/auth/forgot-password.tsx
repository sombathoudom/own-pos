import { Head, Link, useForm } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
} from 'react-bootstrap';

import GuestLayout from '@/Layouts/GuestLayout';
import { login as loginPage } from '@/routes';
import { email as sendResetLink } from '@/routes/password';

type ForgotPasswordProps = {
    status?: string;
};

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(sendResetLink.url());
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

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
                                    Reset access without leaving the admin theme
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
                                            Forgot password?
                                        </h5>
                                        <p className="text-muted">
                                            We&apos;ll email you a reset link.
                                        </p>
                                        <i className="ri-mail-send-line display-5 text-success mb-3"></i>
                                    </div>

                                    <Alert
                                        className="alert-warning mb-3 border-0 text-center"
                                        role="alert"
                                    >
                                        Enter the email address attached to your
                                        account.
                                    </Alert>

                                    {status && (
                                        <div className="alert alert-success">
                                            {status}
                                        </div>
                                    )}

                                    <Form onSubmit={submit}>
                                        <div className="mb-4">
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

                                        <Button
                                            className="btn btn-success w-100"
                                            disabled={processing}
                                            type="submit"
                                        >
                                            {processing
                                                ? 'Sending...'
                                                : 'Send reset link'}
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>

                            <div className="mt-4 text-center">
                                <p className="mb-0">
                                    Remembered your password?{' '}
                                    <Link
                                        href={loginPage()}
                                        className="fw-semibold text-decoration-underline text-primary"
                                    >
                                        Go back to sign in
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

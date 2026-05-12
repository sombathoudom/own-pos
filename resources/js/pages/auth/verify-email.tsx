import { Head, Link, router } from '@inertiajs/react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';

import GuestLayout from '@/Layouts/GuestLayout';
import { logout } from '@/routes';
import { send as resendVerification } from '@/routes/verification';

type VerifyEmailProps = {
    status?: string;
};

export default function VerifyEmail({ status }: VerifyEmailProps) {
    return (
        <GuestLayout>
            <Head title="Verify Email" />

            <div className="auth-page-content">
                <Container>
                    <Row>
                        <Col lg={12}>
                            <div className="mt-sm-5 text-white-50 mb-4 text-center">
                                <Link
                                    href="/"
                                    className="d-inline-block auth-logo"
                                >
                                    <span className="fs-3 fw-semibold text-white">
                                        Wifey POS
                                    </span>
                                </Link>
                                <p className="fs-15 fw-medium mt-3">
                                    One last step before entering the dashboard
                                </p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="justify-content-center">
                        <Col md={8} lg={6} xl={5}>
                            <Card className="mt-4">
                                <Card.Body className="p-4 text-center">
                                    <div className="avatar-lg mx-auto mb-4">
                                        <div className="avatar-title bg-light display-5 rounded-circle text-primary">
                                            <i className="ri-mail-line"></i>
                                        </div>
                                    </div>

                                    <h4 className="mb-3">
                                        Verify your email address
                                    </h4>
                                    <p className="mb-4 text-muted">
                                        We sent you a verification link. Open it
                                        in your inbox, or request a fresh one if
                                        needed.
                                    </p>

                                    {status && (
                                        <div className="alert alert-success">
                                            {status}
                                        </div>
                                    )}

                                    <div className="d-grid gap-2">
                                        <Button
                                            onClick={() =>
                                                router.post(
                                                    resendVerification(),
                                                )
                                            }
                                            className="btn btn-success"
                                        >
                                            Resend verification email
                                        </Button>
                                        <Link
                                            href={logout()}
                                            method="post"
                                            as="button"
                                            className="btn btn-soft-danger"
                                        >
                                            Sign out
                                        </Link>
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

import { Head, Link } from '@inertiajs/react';
import { Badge, Button, Card, Col, Container, Row } from 'react-bootstrap';

import GuestLayout from '@/Layouts/GuestLayout';
import { home, login, register } from '@/routes';

type WelcomeProps = {
    canRegister: boolean;
};

export default function Welcome({ canRegister }: WelcomeProps) {
    return (
        <GuestLayout>
            <Head title="Welcome" />

            <div className="auth-page-content mt-lg-5">
                <Container>
                    <Row className="justify-content-center">
                        <Col xl={10}>
                            <Card className="overflow-hidden border-0 shadow-lg">
                                <Card.Body className="p-0">
                                    <Row className="g-0 align-items-stretch">
                                        <Col
                                            lg={6}
                                            className="bg-gradient d-flex flex-column justify-content-between bg-primary p-5 text-white"
                                        >
                                            <div>
                                                <Badge
                                                    bg="light"
                                                    text="dark"
                                                    className="text-uppercase mb-3"
                                                >
                                                    Velzon Minimal
                                                </Badge>
                                                <h1 className="display-6 fw-semibold mb-3">
                                                    A cleaner admin shell for
                                                    your Laravel POS.
                                                </h1>
                                                <p className="fs-15 text-opacity-75 mb-0 text-white">
                                                    The project now uses the
                                                    Velzon visual language as
                                                    the default Inertia
                                                    experience, starting with
                                                    auth, dashboard, and account
                                                    settings.
                                                </p>
                                            </div>

                                            <div className="d-flex mt-4 flex-wrap gap-2">
                                                <Link
                                                    href={login()}
                                                    as={Button}
                                                    className="btn btn-light fw-semibold text-primary"
                                                >
                                                    Sign in
                                                </Link>
                                                {canRegister && (
                                                    <Link
                                                        href={register()}
                                                        as={Button}
                                                        className="btn btn-outline-light"
                                                    >
                                                        Create account
                                                    </Link>
                                                )}
                                            </div>
                                        </Col>

                                        <Col lg={6} className="bg-body p-5">
                                            <div className="mb-4">
                                                <h2 className="h4 mb-2">
                                                    What changed
                                                </h2>
                                                <p className="mb-0 text-muted">
                                                    Your Inertia entry points
                                                    now load a Velzon-based
                                                    layout with a
                                                    Zustand-powered UI state
                                                    layer.
                                                </p>
                                            </div>

                                            <div className="vstack gap-3">
                                                <div className="rounded-3 border p-3">
                                                    <div className="fw-semibold mb-1">
                                                        Modern Inertia
                                                        bootstrapping
                                                    </div>
                                                    <div className="fs-14 text-muted">
                                                        Page resolution is
                                                        aligned with the current
                                                        Laravel + Inertia React
                                                        setup.
                                                    </div>
                                                </div>
                                                <div className="rounded-3 border p-3">
                                                    <div className="fw-semibold mb-1">
                                                        Velzon minimal styling
                                                    </div>
                                                    <div className="fs-14 text-muted">
                                                        Shared auth, dashboard,
                                                        and settings screens now
                                                        follow the purchased
                                                        theme.
                                                    </div>
                                                </div>
                                                <div className="rounded-3 border p-3">
                                                    <div className="fw-semibold mb-1">
                                                        Zustand instead of Redux
                                                    </div>
                                                    <div className="fs-14 text-muted">
                                                        Layout state is managed
                                                        without a Redux provider
                                                        or thunk chain.
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <Link
                                                    href={home()}
                                                    className="text-decoration-none fw-semibold"
                                                >
                                                    Stay on home
                                                </Link>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </GuestLayout>
    );
}

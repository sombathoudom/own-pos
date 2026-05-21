import { Head, Link } from '@inertiajs/react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';

import GuestLayout from '@/Layouts/GuestLayout';
import { login } from '@/routes';

type WelcomeProps = {
    canRegister: boolean;
};

export default function Welcome({ canRegister }: WelcomeProps) {
    return (
        <GuestLayout>
            <Head title="Doly Outfits — POS System" />

            <div className="auth-page-content mt-lg-5">
                <Container>
                    <Row className="justify-content-center">
                        <Col xl={10} lg={11}>
                            <Card className="overflow-hidden border-0 shadow-lg">
                                <Card.Body className="p-0">
                                    <Row className="g-0">
                                        {/* Left side — Branding */}
                                        <Col
                                            lg={5}
                                            className="d-flex flex-column justify-content-between p-5 text-white"
                                            style={{
                                                background:
                                                    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                                                minHeight: 520,
                                            }}
                                        >
                                            <div>
                                                <div className="mb-4">
                                                    <span
                                                        className="d-block fw-bold"
                                                        style={{
                                                            fontSize: '2rem',
                                                            letterSpacing: 3,
                                                        }}
                                                    >
                                                        DOLY
                                                    </span>
                                                    <span
                                                        className="d-block fw-light"
                                                        style={{
                                                            fontSize: '1.5rem',
                                                            letterSpacing: 6,
                                                            opacity: 0.9,
                                                        }}
                                                    >
                                                        OUTFITS
                                                    </span>
                                                </div>

                                                <div
                                                    className="mb-4"
                                                    style={{
                                                        width: 48,
                                                        height: 3,
                                                        background:
                                                            'linear-gradient(90deg, #e94560, transparent)',
                                                    }}
                                                ></div>

                                                <h1
                                                    className="fw-semibold mb-3"
                                                    style={{
                                                        fontSize: '1.75rem',
                                                        lineHeight: 1.3,
                                                    }}
                                                >
                                                    Boutique Point of Sale
                                                </h1>
                                                <p
                                                    className="mb-0"
                                                    style={{
                                                        fontSize: '0.95rem',
                                                        opacity: 0.75,
                                                        lineHeight: 1.6,
                                                    }}
                                                >
                                                    Manage inventory, track
                                                    sales, handle deliveries, and
                                                    close daily ledgers — all in
                                                    one place built for fashion
                                                    retail.
                                                </p>
                                            </div>

                                            <div className="mt-5">
                                                <div className="d-flex align-items-center gap-3 mb-4">
                                                    <div
                                                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                                        style={{
                                                            width: 44,
                                                            height: 44,
                                                            background:
                                                                'rgba(233, 69, 96, 0.2)',
                                                            border: '1px solid rgba(233, 69, 96, 0.4)',
                                                        }}
                                                    >
                                                        <i className="ri-shopping-bag-3-line fs-5"></i>
                                                    </div>
                                                    <div>
                                                        <div
                                                            className="fw-semibold"
                                                            style={{
                                                                fontSize:
                                                                    '0.9rem',
                                                            }}
                                                        >
                                                            Sales & Orders
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    '0.8rem',
                                                                opacity: 0.6,
                                                            }}
                                                        >
                                                            POS, invoicing,
                                                            returns
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center gap-3 mb-4">
                                                    <div
                                                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                                        style={{
                                                            width: 44,
                                                            height: 44,
                                                            background:
                                                                'rgba(100, 126, 234, 0.2)',
                                                            border: '1px solid rgba(100, 126, 234, 0.4)',
                                                        }}
                                                    >
                                                        <i className="ri-archive-line fs-5"></i>
                                                    </div>
                                                    <div>
                                                        <div
                                                            className="fw-semibold"
                                                            style={{
                                                                fontSize:
                                                                    '0.9rem',
                                                            }}
                                                        >
                                                            Inventory
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    '0.8rem',
                                                                opacity: 0.6,
                                                            }}
                                                        >
                                                            Stock, purchases,
                                                            variants
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center gap-3">
                                                    <div
                                                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                                        style={{
                                                            width: 44,
                                                            height: 44,
                                                            background:
                                                                'rgba(16, 185, 129, 0.2)',
                                                            border: '1px solid rgba(16, 185, 129, 0.4)',
                                                        }}
                                                    >
                                                        <i className="ri-line-chart-line fs-5"></i>
                                                    </div>
                                                    <div>
                                                        <div
                                                            className="fw-semibold"
                                                            style={{
                                                                fontSize:
                                                                    '0.9rem',
                                                            }}
                                                        >
                                                            Reports
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    '0.8rem',
                                                                opacity: 0.6,
                                                            }}
                                                        >
                                                            Daily, monthly,
                                                            profit & loss
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>

                                        {/* Right side — CTA */}
                                        <Col
                                            lg={7}
                                            className="bg-white p-5 d-flex flex-column justify-content-center"
                                        >
                                            <div className="text-center mb-5">
                                                <div
                                                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                                    style={{
                                                        width: 72,
                                                        height: 72,
                                                        background:
                                                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    }}
                                                >
                                                    <i className="ri-store-2-line fs-2 text-white"></i>
                                                </div>
                                                <h2
                                                    className="mb-2"
                                                    style={{
                                                        fontWeight: 700,
                                                        color: '#1a1a2e',
                                                    }}
                                                >
                                                    Staff Access
                                                </h2>
                                                <p
                                                    className="text-muted mx-auto"
                                                    style={{
                                                        maxWidth: 360,
                                                        fontSize: '0.95rem',
                                                    }}
                                                >
                                                    This system is reserved for
                                                    authorized staff members.
                                                    Please sign in with your
                                                    company email to continue.
                                                </p>
                                            </div>

                                            <div className="d-grid gap-3 mx-auto" style={{ maxWidth: 320, width: '100%' }}>
                                                <Link
                                                    href={login()}
                                                    as={Button}
                                                    size="lg"
                                                    className="fw-semibold border-0"
                                                    style={{
                                                        background:
                                                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        padding:
                                                            '0.75rem 1.5rem',
                                                    }}
                                                >
                                                    <i className="ri-login-box-line me-2"></i>
                                                    Sign In to POS
                                                </Link>

                                                {canRegister && (
                                                    <p className="text-center text-muted small mb-0">
                                                        New staff?{' '}
                                                        <Link
                                                            href={login()}
                                                            className="text-decoration-none fw-semibold"
                                                            style={{
                                                                color: '#667eea',
                                                            }}
                                                        >
                                                            Contact your manager
                                                            for access.
                                                        </Link>
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-5 pt-4 border-top">
                                                <Row className="text-center g-3">
                                                    <Col xs={4}>
                                                        <div
                                                            className="fw-bold"
                                                            style={{
                                                                fontSize:
                                                                    '1.25rem',
                                                                color: '#667eea',
                                                            }}
                                                        >
                                                            24/7
                                                        </div>
                                                        <div
                                                            className="text-muted"
                                                            style={{
                                                                fontSize:
                                                                    '0.75rem',
                                                            }}
                                                        >
                                                            Cloud Access
                                                        </div>
                                                    </Col>
                                                    <Col xs={4}>
                                                        <div
                                                            className="fw-bold"
                                                            style={{
                                                                fontSize:
                                                                    '1.25rem',
                                                                color: '#667eea',
                                                            }}
                                                        >
                                                            Secure
                                                        </div>
                                                        <div
                                                            className="text-muted"
                                                            style={{
                                                                fontSize:
                                                                    '0.75rem',
                                                            }}
                                                        >
                                                            Role-based Auth
                                                        </div>
                                                    </Col>
                                                    <Col xs={4}>
                                                        <div
                                                            className="fw-bold"
                                                            style={{
                                                                fontSize:
                                                                    '1.25rem',
                                                                color: '#667eea',
                                                            }}
                                                        >
                                                            Fast
                                                        </div>
                                                        <div
                                                            className="text-muted"
                                                            style={{
                                                                fontSize:
                                                                    '0.75rem',
                                                            }}
                                                        >
                                                            Real-time Sync
                                                        </div>
                                                    </Col>
                                                </Row>
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

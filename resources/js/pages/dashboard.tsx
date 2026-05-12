import { Head } from '@inertiajs/react';
import { Card, Col, Container, Row } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';

function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Overview" pageTitle="Dashboard" />

                    <Row>
                        <Col xl={8}>
                            <Card>
                                <Card.Body>
                                    <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                                        <div>
                                            <h4 className="mb-2">
                                                Velzon minimal is now the
                                                default app shell.
                                            </h4>
                                            <p className="mb-0 text-muted">
                                                This dashboard is wired through
                                                Inertia and uses the shared
                                                layout with Zustand-driven UI
                                                settings.
                                            </p>
                                        </div>
                                        <span className="badge bg-success-subtle text-success fs-12">
                                            Laravel 13 + Inertia v3
                                        </span>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xl={4}>
                            <Card>
                                <Card.Body>
                                    <h5 className="mb-3">Migration status</h5>
                                    <div className="vstack gap-3">
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Theme shell
                                            </span>
                                            <span className="fw-semibold text-success">
                                                Ready
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Auth screens
                                            </span>
                                            <span className="fw-semibold text-success">
                                                Ready
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Settings pages
                                            </span>
                                            <span className="fw-semibold text-success">
                                                Ready
                                            </span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

Dashboard.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default Dashboard;

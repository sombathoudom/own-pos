import { Head } from '@inertiajs/react';
import { Card, Col, Container, Row } from 'react-bootstrap';

import SettingsNav from '@/Components/SettingsNav';
import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { useAppearance } from '@/hooks/use-appearance';

const options = [
    {
        key: 'light',
        label: 'Light',
        description: 'Bright workspace with strong contrast.',
    },
    {
        key: 'dark',
        label: 'Dark',
        description: 'Reduced glare for long admin sessions.',
    },
    {
        key: 'system',
        label: 'System',
        description: 'Follow the operating system preference.',
    },
] as const;

function Appearance() {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <>
            <Head title="Appearance Settings" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Appearance" pageTitle="Settings" />

                    <Row>
                        <Col xl={3}>
                            <SettingsNav current="appearance" />
                        </Col>

                        <Col xl={9}>
                            <Card>
                                <Card.Body>
                                    <div className="mb-4">
                                        <h4 className="card-title mb-1">
                                            Theme preference
                                        </h4>
                                        <p className="mb-0 text-muted">
                                            Choose how Velzon should look each
                                            time you open the app.
                                        </p>
                                    </div>

                                    <Row className="g-3">
                                        {options.map((option) => (
                                            <Col md={4} key={option.key}>
                                                <button
                                                    type="button"
                                                    className={`card h-100 w-100 border text-start ${appearance === option.key ? 'border-primary shadow-sm' : 'border-light'}`}
                                                    onClick={() =>
                                                        updateAppearance(
                                                            option.key,
                                                        )
                                                    }
                                                >
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                                            <span className="fw-semibold">
                                                                {option.label}
                                                            </span>
                                                            {appearance ===
                                                                option.key && (
                                                                <span className="badge bg-primary-subtle text-primary">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="fs-14 mb-0 text-muted">
                                                            {option.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

Appearance.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default Appearance;

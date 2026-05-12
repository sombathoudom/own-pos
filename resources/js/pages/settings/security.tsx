import { Head, router, useForm } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
} from 'react-bootstrap';

import SettingsNav from '@/Components/SettingsNav';
import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { edit as securityEdit } from '@/routes/security';
import { enable, disable } from '@/routes/two-factor';
import { update as updatePassword } from '@/routes/user-password';

type SecurityProps = {
    canManageTwoFactor: boolean;
    twoFactorEnabled?: boolean;
    requiresConfirmation?: boolean;
};

function Security({
    canManageTwoFactor,
    twoFactorEnabled = false,
    requiresConfirmation = false,
}: SecurityProps) {
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        put(updatePassword.url(), {
            onSuccess: () =>
                reset('current_password', 'password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Security Settings" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Security" pageTitle="Settings" />

                    <Row>
                        <Col xl={3}>
                            <SettingsNav current="security" />
                        </Col>

                        <Col xl={9}>
                            <Card>
                                <Card.Body>
                                    <div className="mb-4">
                                        <h4 className="card-title mb-1">
                                            Update password
                                        </h4>
                                        <p className="mb-0 text-muted">
                                            Use a strong password that you do
                                            not reuse elsewhere.
                                        </p>
                                    </div>

                                    <Form onSubmit={submit}>
                                        <div className="mb-3">
                                            <Form.Label
                                                htmlFor="current_password"
                                                className="form-label"
                                            >
                                                Current password
                                            </Form.Label>
                                            <Form.Control
                                                id="current_password"
                                                type="password"
                                                value={data.current_password}
                                                onChange={(event) =>
                                                    setData(
                                                        'current_password',
                                                        event.target.value,
                                                    )
                                                }
                                                className={
                                                    errors.current_password
                                                        ? 'is-invalid'
                                                        : ''
                                                }
                                                required
                                            />
                                            <Form.Control.Feedback
                                                type="invalid"
                                                className="d-block"
                                            >
                                                {errors.current_password}
                                            </Form.Control.Feedback>
                                        </div>

                                        <Row>
                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Form.Label
                                                        htmlFor="password"
                                                        className="form-label"
                                                    >
                                                        New password
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="password"
                                                        type="password"
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
                                                        required
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.password}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="mb-4">
                                                    <Form.Label
                                                        htmlFor="password_confirmation"
                                                        className="form-label"
                                                    >
                                                        Confirm password
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="password_confirmation"
                                                        type="password"
                                                        value={
                                                            data.password_confirmation
                                                        }
                                                        onChange={(event) =>
                                                            setData(
                                                                'password_confirmation',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className={
                                                            errors.password_confirmation
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                        required
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {
                                                            errors.password_confirmation
                                                        }
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Button
                                            type="submit"
                                            className="btn btn-success"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Saving...'
                                                : 'Update password'}
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Body>
                                    <div className="mb-4">
                                        <h4 className="card-title mb-1">
                                            Two-factor authentication
                                        </h4>
                                        <p className="mb-0 text-muted">
                                            Add an extra verification step to
                                            your sign-in flow.
                                        </p>
                                    </div>

                                    {!canManageTwoFactor ? (
                                        <Alert
                                            variant="secondary"
                                            className="mb-0"
                                        >
                                            Two-factor authentication is
                                            currently disabled for this
                                            application.
                                        </Alert>
                                    ) : (
                                        <>
                                            <Alert
                                                variant={
                                                    twoFactorEnabled
                                                        ? 'success'
                                                        : 'warning'
                                                }
                                            >
                                                {twoFactorEnabled
                                                    ? 'Two-factor authentication is enabled for your account.'
                                                    : 'Two-factor authentication is not enabled yet.'}
                                            </Alert>

                                            {requiresConfirmation &&
                                                !twoFactorEnabled && (
                                                    <p className="fs-14 text-muted">
                                                        After enabling it,
                                                        Fortify may ask you to
                                                        confirm the setup with a
                                                        generated code.
                                                    </p>
                                                )}

                                            <Button
                                                variant={
                                                    twoFactorEnabled
                                                        ? 'outline-danger'
                                                        : 'outline-primary'
                                                }
                                                onClick={() => {
                                                    if (twoFactorEnabled) {
                                                        router.delete(
                                                            disable(),
                                                            {
                                                                preserveScroll: true,
                                                                preserveState: true,
                                                            },
                                                        );
                                                        return;
                                                    }

                                                    router.post(
                                                        enable(),
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                        },
                                                    );
                                                }}
                                            >
                                                {twoFactorEnabled
                                                    ? 'Disable two-factor'
                                                    : 'Enable two-factor'}
                                            </Button>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

Security.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default Security;

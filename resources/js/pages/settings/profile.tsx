import { Head, useForm, usePage } from '@inertiajs/react';
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
import {
    destroy as destroyProfile,
    update as updateProfile,
} from '@/routes/profile';
import type { Auth } from '@/types/auth';

type ProfilePageProps = {
    auth: Auth;
    mustVerifyEmail: boolean;
    status?: string;
};

function Profile() {
    const { auth, mustVerifyEmail, status } = usePage<ProfilePageProps>().props;
    const { data, setData, patch, processing, errors } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });
    const deleteForm = useForm({ password: '' });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        patch(updateProfile.url());
    };

    const removeAccount = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        deleteForm.delete(destroyProfile.url(), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Profile Settings" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Profile" pageTitle="Settings" />

                    <Row>
                        <Col xl={3}>
                            <SettingsNav current="profile" />
                        </Col>

                        <Col xl={9}>
                            <Card>
                                <Card.Body>
                                    <div className="mb-4">
                                        <h4 className="card-title mb-1">
                                            Profile information
                                        </h4>
                                        <p className="mb-0 text-muted">
                                            Update the contact details attached
                                            to your account.
                                        </p>
                                    </div>

                                    {status && (
                                        <Alert variant="success">
                                            {status}
                                        </Alert>
                                    )}

                                    {mustVerifyEmail &&
                                        !auth.user.email_verified_at && (
                                            <Alert variant="warning">
                                                Your email address is not
                                                verified yet. Check your inbox
                                                after saving any email changes.
                                            </Alert>
                                        )}

                                    <Form onSubmit={submit}>
                                        <Row>
                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Form.Label
                                                        htmlFor="name"
                                                        className="form-label"
                                                    >
                                                        Full name
                                                    </Form.Label>
                                                    <Form.Control
                                                        id="name"
                                                        value={data.name}
                                                        onChange={(event) =>
                                                            setData(
                                                                'name',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className={
                                                            errors.name
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                        required
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.name}
                                                    </Form.Control.Feedback>
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="mb-3">
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
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className={
                                                            errors.email
                                                                ? 'is-invalid'
                                                                : ''
                                                        }
                                                        required
                                                    />
                                                    <Form.Control.Feedback
                                                        type="invalid"
                                                        className="d-block"
                                                    >
                                                        {errors.email}
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
                                                : 'Save changes'}
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>

                            <Card className="border-danger border-opacity-25">
                                <Card.Body>
                                    <div className="mb-4">
                                        <h4 className="card-title text-danger mb-1">
                                            Delete account
                                        </h4>
                                        <p className="mb-0 text-muted">
                                            This action is permanent and cannot
                                            be undone.
                                        </p>
                                    </div>

                                    <Form onSubmit={removeAccount}>
                                        <div className="mb-3">
                                            <Form.Label
                                                htmlFor="delete-password"
                                                className="form-label"
                                            >
                                                Current password
                                            </Form.Label>
                                            <Form.Control
                                                id="delete-password"
                                                type="password"
                                                value={deleteForm.data.password}
                                                onChange={(event) =>
                                                    deleteForm.setData(
                                                        'password',
                                                        event.target.value,
                                                    )
                                                }
                                                className={
                                                    deleteForm.errors.password
                                                        ? 'is-invalid'
                                                        : ''
                                                }
                                                required
                                            />
                                            <Form.Control.Feedback
                                                type="invalid"
                                                className="d-block"
                                            >
                                                {deleteForm.errors.password}
                                            </Form.Control.Feedback>
                                        </div>

                                        <Button
                                            type="submit"
                                            variant="danger"
                                            disabled={deleteForm.processing}
                                        >
                                            {deleteForm.processing
                                                ? 'Deleting...'
                                                : 'Delete account'}
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

Profile.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default Profile;

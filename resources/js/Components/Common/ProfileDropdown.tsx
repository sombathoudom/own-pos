import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { Link, usePage } from '@inertiajs/react';
//import images
import avatar1 from '../../../images/users/avatar-1.jpg';

const ProfileDropdown = () => {
    const user = usePage().props.auth.user;

    //Dropdown Toggle
    const [isProfileDropdown, setIsProfileDropdown] = useState<boolean>(false);
    const toggleProfileDropdown = () => {
        setIsProfileDropdown(!isProfileDropdown);
    };
    return (
        <React.Fragment>
            <Dropdown
                show={isProfileDropdown}
                onClick={toggleProfileDropdown}
                className="ms-sm-3 header-item topbar-user"
            >
                <Dropdown.Toggle
                    as="button"
                    type="button"
                    className="arrow-none btn"
                >
                    <span className="d-flex align-items-center">
                        <img
                            className="rounded-circle header-profile-user"
                            src={avatar1}
                            alt="Header Avatar"
                        />
                        <span className="ms-xl-2 text-start">
                            <span className="d-none d-xl-inline-block fw-medium user-name-text ms-1">
                                {user.name}
                            </span>
                            <span className="d-none d-xl-block fs-12 user-name-sub-text ms-1 text-muted">
                                Founder
                            </span>
                        </span>
                    </span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu-end">
                    <h6 className="dropdown-header">Welcome {user.name}!</h6>

                    <Dropdown.Item href={''} className="dropdown-item">
                        <i className="mdi mdi-account-circle fs-16 me-1 align-middle text-muted"></i>
                        <span className="align-middle">Edit Profile</span>
                    </Dropdown.Item>

                    <Dropdown.Item href="/apps-chat" className="dropdown-item">
                        <i className="mdi mdi-message-text-outline fs-16 me-1 align-middle text-muted"></i>{' '}
                        <span className="align-middle">Messages</span>
                    </Dropdown.Item>
                    <Dropdown.Item href={'#'} className="dropdown-item">
                        <i className="mdi mdi-calendar-check-outline fs-16 me-1 align-middle text-muted"></i>{' '}
                        <span className="align-middle">Taskboard</span>
                    </Dropdown.Item>

                    <Dropdown.Item href="/pages-faqs" className="dropdown-item">
                        <i className="mdi mdi-lifebuoy fs-16 me-1 align-middle text-muted"></i>{' '}
                        <span className="align-middle">Help</span>
                    </Dropdown.Item>

                    <div className="dropdown-divider"></div>

                    <Dropdown.Item
                        href="/pages-profile"
                        className="dropdown-item"
                    >
                        <i className="mdi mdi-wallet fs-16 me-1 align-middle text-muted"></i>{' '}
                        <span className="align-middle">
                            Balance : <b>$5971.67</b>
                        </span>
                    </Dropdown.Item>

                    <Dropdown.Item
                        href="/pages-profile-settings"
                        className="dropdown-item"
                    >
                        <span className="badge bg-success-subtle text-success float-end mt-1">
                            New
                        </span>
                        <i className="mdi mdi-cog-outline fs-16 me-1 align-middle text-muted"></i>{' '}
                        <span className="align-middle">Settings</span>
                    </Dropdown.Item>

                    <Dropdown.Item
                        href="/auth-lockscreen-basic"
                        className="dropdown-item"
                    >
                        <i className="mdi mdi-lock fs-16 me-1 align-middle text-muted"></i>{' '}
                        <span className="align-middle">Lock screen</span>
                    </Dropdown.Item>
                    <Link
                        className="dropdown-item"
                        as="button"
                        method="post"
                        href={route('logout')}
                    >
                        <i className="mdi mdi-logout fs-16 me-1 align-middle text-muted"></i>{' '}
                        <span className="align-middle" data-key="t-logout">
                            Logout
                        </span>
                    </Link>
                </Dropdown.Menu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;

import React, { useEffect } from 'react';
import SimpleBar from 'simplebar-react';

//Import Components
import VerticalLayout from './VerticalLayouts';
import { Container } from 'react-bootstrap';
import { Link } from '@inertiajs/react';
import HorizontalLayout from './HorizontalLayout';
import TwoColumnLayout from './TwoColumnLayout';

const Sidebar = ({ layoutType }: any) => {
    useEffect(() => {
        const verticalOverlay = document.querySelector('.vertical-overlay');
        const closeSidebar = () => {
            document.body.classList.remove('vertical-sidebar-enable');
        };

        if (verticalOverlay) {
            verticalOverlay.addEventListener('click', closeSidebar);
        }

        return () => {
            verticalOverlay?.removeEventListener('click', closeSidebar);
        };
    }, []);

    const addEventListenerOnSmHoverMenu = () => {
        // add listener Sidebar Hover icon on change layout from setting
        if (
            document.documentElement.getAttribute('data-sidebar-size') ===
            'sm-hover'
        ) {
            document.documentElement.setAttribute(
                'data-sidebar-size',
                'sm-hover-active',
            );
        } else if (
            document.documentElement.getAttribute('data-sidebar-size') ===
            'sm-hover-active'
        ) {
            document.documentElement.setAttribute(
                'data-sidebar-size',
                'sm-hover',
            );
        } else {
            document.documentElement.setAttribute(
                'data-sidebar-size',
                'sm-hover',
            );
        }
    };
    return (
        <React.Fragment>
            <div className="app-menu navbar-menu">
                <div className="navbar-brand-box">
                    <Link href="/" className="logo logo-dark">
                        <span className="logo-sm fw-bold text-uppercase">
                            WP
                        </span>
                        <span className="logo-lg fw-semibold">Wifey POS</span>
                    </Link>

                    <Link href="/" className="logo logo-light">
                        <span className="logo-sm fw-bold text-uppercase text-white">
                            WP
                        </span>
                        <span className="logo-lg fw-semibold text-white">
                            Wifey POS
                        </span>
                    </Link>
                    <button
                        onClick={addEventListenerOnSmHoverMenu}
                        type="button"
                        className="btn btn-sm fs-20 header-item btn-vertical-sm-hover float-end p-0"
                        id="vertical-hover"
                    >
                        <i className="ri-record-circle-line"></i>
                    </button>
                </div>
                {layoutType === 'horizontal' ? (
                    <div id="scrollbar">
                        <Container fluid>
                            <div id="two-column-menu"></div>
                            <ul className="navbar-nav" id="navbar-nav">
                                <HorizontalLayout />
                            </ul>
                        </Container>
                    </div>
                ) : layoutType === 'twocolumn' ? (
                    <React.Fragment>
                        <TwoColumnLayout layoutType={layoutType} />
                        <div className="sidebar-background"></div>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <SimpleBar id="scrollbar" className="h-100">
                            <Container fluid>
                                <div id="two-column-menu"></div>
                                <ul className="navbar-nav" id="navbar-nav">
                                    <VerticalLayout layoutType={layoutType} />
                                </ul>
                            </Container>
                        </SimpleBar>
                        <div className="sidebar-background"></div>
                    </React.Fragment>
                )}
            </div>
            <div className="vertical-overlay"></div>
        </React.Fragment>
    );
};

export default Sidebar;

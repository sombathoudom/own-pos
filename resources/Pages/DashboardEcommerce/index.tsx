import React from 'react';
import { Head } from '@inertiajs/react';
import { Container } from 'react-bootstrap';

import Layout from '../../Layouts';
import BreadCrumb from '../../Components/Common/BreadCrumb';

export default function Dashboard() {


  return (
    <React.Fragment>
      <Head title='Dashboard | Velzon - React Admin & Dashboard Template' />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={'Ecommerce'} pageTitle={'Dashboard'} />
        </Container >
      </div >
    </React.Fragment >
  );
}
Dashboard.layout = (page: any) => <Layout children={page} />;
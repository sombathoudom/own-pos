// resources/js/Pages/Media/Index.tsx  (unchanged, but shown for clarity)
import React from "react";
import { Head } from "@inertiajs/react";
import { Container } from "react-bootstrap";

import Layout from "../../Layouts";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import MediaBankBrowser from "../../Components/Media/MediaBankBrowser";

export default function Index() {
  return (
    <React.Fragment>
      <Head title="Media Bank | Velzon - React Admin & Dashboard Template" />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={"Media Bank"} pageTitle={"Media"} />
          <MediaBankBrowser mode="page" selectable={false} />
        </Container>
      </div>
    </React.Fragment>
  );
}

Index.layout = (page: any) => <Layout children={page} />;
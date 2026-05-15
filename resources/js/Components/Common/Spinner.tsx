import React, { useEffect } from 'react';
import { Spinner } from 'react-bootstrap';

const Spinners = ({ setLoading }: any) => {
    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }, [setLoading]);

    return (
        <React.Fragment>
            <Spinner
                className="position-absolute start-50 top-50"
                animation="border"
                variant="primary"
            />
        </React.Fragment>
    );
};

export default Spinners;

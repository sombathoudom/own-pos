import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'react-toastify';

type PageProps = {
    flash?: {
        success?: string | null;
        error?: string | null;
        now?: number | null;
    };
};

export default function FlashToastBridge() {
    const { flash } = usePage<PageProps>().props;
    useEffect(() => {
        // toast.dismiss();
        if (flash?.success) {
            toast(flash.success, {
                hideProgressBar: true,
                className: 'bg-success text-white',
                toastId: flash.now,
            });
        }
        if (flash?.error) {
            toast(flash.error, {
                hideProgressBar: true,
                className: 'bg-danger text-white',
                toastId: flash.now,
            });
        }
    }, [flash?.success, flash?.error, flash?.now]);

    return null;
}

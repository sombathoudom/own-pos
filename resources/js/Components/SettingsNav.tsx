import { Link } from '@inertiajs/react';

import { edit as appearanceEdit } from '@/routes/appearance';
import { edit as profileEdit } from '@/routes/profile';
import { edit as securityEdit } from '@/routes/security';

type SettingsNavProps = {
    current: 'profile' | 'security' | 'appearance';
};

const links = [
    {
        key: 'profile',
        label: 'Profile',
        icon: 'ri-user-3-line',
        href: profileEdit(),
    },
    {
        key: 'security',
        label: 'Security',
        icon: 'ri-shield-keyhole-line',
        href: securityEdit(),
    },
    {
        key: 'appearance',
        label: 'Appearance',
        icon: 'ri-palette-line',
        href: appearanceEdit(),
    },
] as const;

export default function SettingsNav({ current }: SettingsNavProps) {
    return (
        <div className="card">
            <div className="card-body">
                <div className="nav nav-pills flex-column gap-2">
                    {links.map((link) => (
                        <Link
                            key={link.key}
                            href={link.href}
                            className={`nav-link d-flex align-items-center gap-2 ${current === link.key ? 'active' : ''}`}
                        >
                            <i className={link.icon}></i>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

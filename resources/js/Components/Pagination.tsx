import React from 'react';
import { Link } from '@inertiajs/react';
import type { LaravelPaginator } from '@/types/app';

type Props<T> = { paginator: LaravelPaginator<T> };

export default function Pagination<T>({ paginator }: Props<T>) {
    const links = paginator?.links ?? [];
    const { from, to, total } = paginator;
    const hasPages = links.length > 3;

    return (
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
            <div className="small text-muted">
                {total === 0 ? (
                    'No results'
                ) : (
                    <>
                        Showing <strong>{from}</strong> to <strong>{to}</strong>{' '}
                        of <strong>{total}</strong> results
                    </>
                )}
            </div>

            {hasPages && (
                <nav aria-label="Pagination">
                    <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                        {links.map((link, i) => {
                            const label = normalizeLabel(link.label);
                            const disabled = !link.url;

                            return (
                                <li
                                    key={i}
                                    className={`page-item ${link.active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                                >
                                    {link.url ? (
                                        <Link
                                            className="page-link"
                                            href={link.url}
                                            preserveScroll
                                            dangerouslySetInnerHTML={{
                                                __html: label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            className="page-link"
                                            dangerouslySetInnerHTML={{
                                                __html: label,
                                            }}
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            )}
        </div>
    );
}

function normalizeLabel(label: string) {
    if (label.includes('Previous')) return '&laquo;';
    if (label.includes('Next')) return '&raquo;';
    return label;
}

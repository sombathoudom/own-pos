import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

export type IndexFilters = {
    search?: string;
    direction?: 'asc' | 'desc';
    per_page?: number;
};

type Props = {
    indexRouteName: string;
    filters: IndexFilters;
    searchPlaceholder?: string;
    orderAscText?: string;
    orderDescText?: string;
};

export default function IndexToolbar({
    indexRouteName,
    filters,
    searchPlaceholder = 'Search by name...',
    orderAscText = 'Name A → Z',
    orderDescText = 'Name Z → A',
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [direction, setDirection] = useState<'asc' | 'desc'>(
        filters.direction ?? 'asc',
    );
    const [perPage, setPerPage] = useState<number>(filters.per_page ?? 10);

    useEffect(() => {
        setSearch(filters.search ?? '');
        setDirection(filters.direction ?? 'asc');
        setPerPage(filters.per_page ?? 10);
    }, [filters.search, filters.direction, filters.per_page]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route(indexRouteName),
            { search: search || undefined, direction, per_page: perPage },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const reset = () => {
        setSearch('');
        setDirection('asc');
        setPerPage(10);
        router.get(
            route(indexRouteName),
            {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    return (
        <form onSubmit={submit} className="row g-2 align-items-end mb-3">
            <div className="col-md-6 col-12">
                <label className="form-label mb-1">Search</label>
                <input
                    className="form-control"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                />
            </div>

            <div className="col-md-3 col-6">
                <label className="form-label mb-1">Order</label>
                <select
                    className="form-select"
                    value={direction}
                    onChange={(e) =>
                        setDirection(e.target.value as 'asc' | 'desc')
                    }
                >
                    <option value="asc">{orderAscText}</option>
                    <option value="desc">{orderDescText}</option>
                </select>
            </div>

            <div className="col-md-2 col-6">
                <label className="form-label mb-1">Per page</label>
                <select
                    className="form-select"
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>

            <div className="col-md-1 d-grid col-12">
                <button className="btn btn-primary" type="submit">
                    Go
                </button>
            </div>

            <div className="d-flex justify-content-end col-12">
                <button
                    type="button"
                    className="btn btn-link text-decoration-none"
                    onClick={reset}
                >
                    Reset
                </button>
            </div>
        </form>
    );
}

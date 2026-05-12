import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";

type UserRow = {
    id: number;
    name: string;
    email: string;
    created_at?: string;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Filters = {
    q?: string;
    per_page?: number;
    sort?: "name" | "email" | "created_at" | string;
    dir?: "asc" | "desc" | string;
};

export default function UsersIndex({
    users,
    filters,
}: {
    users: Paginator<UserRow>;
    filters: Filters;
}) {
    const { flash } = usePage().props as any;

    const [q, setQ] = useState < string > (filters?.q ?? "");
    const [perPage, setPerPage] = useState < number > (filters?.per_page ?? users.per_page ?? 15);

    const sort = (filters?.sort as string) || "name";
    const dir = (filters?.dir as string) || "asc";

    const showingText = useMemo(() => {
        if (!users.total) return "No results";
        return `Showing ${users.from ?? 0} to ${users.to ?? 0} of ${users.total} results`;
    }, [users.total, users.from, users.to]);

    const apply = (extra?: Record<string, any>) => {
        router.get(
            route("users.index"),
            {
                q: q || undefined,
                per_page: perPage,
                sort,
                dir,
                ...extra,
            },
            { preserveScroll: true, preserveState: true, replace: true }
        );
    };

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        apply({ page: 1 });
    };

    const clearSearch = () => {
        setQ("");
        router.get(
            route("users.index"),
            { per_page: perPage, sort, dir, page: 1 },
            { preserveScroll: true, preserveState: true, replace: true }
        );
    };

    const changePerPage = (val: number) => {
        setPerPage(val);
        router.get(
            route("users.index"),
            { q: q || undefined, per_page: val, sort, dir, page: 1 },
            { preserveScroll: true, preserveState: true, replace: true }
        );
    };

    const toggleSort = (column: "name" | "email" | "created_at") => {
        const nextDir = sort === column ? (dir === "asc" ? "desc" : "asc") : "asc";

        router.get(
            route("users.index"),
            {
                q: q || undefined,
                per_page: perPage,
                sort: column,
                dir: nextDir,
                page: 1,
            },
            { preserveScroll: true, preserveState: true, replace: true }
        );
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sort !== column) return <span className="text-muted ms-1">↕</span>;
        return <span className="ms-1">{dir === "asc" ? "↑" : "↓"}</span>;
    };

    const goTo = (url: string | null) => {
        if (!url) return;
        router.visit(url, { preserveScroll: true, preserveState: true });
    };

    return (
        <div className="page-content">
            <div className="container-fluid">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <h4 className="mb-0">Users</h4>
                        <div className="text-muted">{showingText}</div>
                    </div>

                    <Link href={route("users.create")} className="btn btn-primary">
                        New User
                    </Link>
                </div>

                {flash?.success && <div className="alert alert-success">{flash.success}</div>}
                {flash?.error && <div className="alert alert-danger">{flash.error}</div>}

                <div className="card mb-3">
                    <div className="card-body">
                        <form onSubmit={submitSearch} className="row g-2 align-items-end">
                            <div className="col-md-6">
                                <label className="form-label">Search</label>
                                <input
                                    className="form-control"
                                    placeholder="Search by name or email..."
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">Per page</label>
                                <select
                                    className="form-select"
                                    value={perPage}
                                    onChange={(e) => changePerPage(parseInt(e.target.value, 10))}
                                >
                                    {[10, 15, 25, 50, 100].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-4 d-flex gap-2">
                                <button type="submit" className="btn btn-outline-primary">
                                    Search
                                </button>
                                <button type="button" className="btn btn-outline-secondary" onClick={clearSearch}>
                                    Clear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body table-responsive">
                        <table className="table table-striped align-middle mb-0">
                            <thead>
                                <tr>
                                    <th style={{ width: "70px" }}>#</th>

                                    <th>
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 text-decoration-none"
                                            onClick={() => toggleSort("name")}
                                        >
                                            Name <SortIcon column="name" />
                                        </button>
                                    </th>

                                    <th>
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 text-decoration-none"
                                            onClick={() => toggleSort("email")}
                                        >
                                            Email <SortIcon column="email" />
                                        </button>
                                    </th>

                                    <th>
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 text-decoration-none"
                                            onClick={() => toggleSort("created_at")}
                                        >
                                            Created <SortIcon column="created_at" />
                                        </button>
                                    </th>

                                    <th className="text-end" style={{ width: "220px" }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.data.map((u, idx) => (
                                    <tr key={u.id}>
                                        <td>{(users.from ?? 1) + idx}</td>
                                        <td className="fw-semibold">{u.name}</td>
                                        <td>{u.email}</td>
                                        <td>{u.created_at ?? "-"}</td>
                                        <td className="text-end">
                                            <Link href={route("users.edit", u.id)} className="btn btn-sm btn-outline-primary me-2">
                                                Edit
                                            </Link>

                                            <Link href={route("users.password.edit", u.id)} className="btn btn-sm btn-outline-secondary me-2">
                                                Reset Password
                                            </Link>

                                            <Link
                                                href={route("users.destroy", u.id)}
                                                method="delete"
                                                as="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onBefore={() => confirm("Delete this user?")}
                                            >
                                                Delete
                                            </Link>

                                            <Link href={route("rbac.users.roles.edit", u.id)} className="btn btn-sm btn-outline-secondary">
                                                Roles
                                            </Link>
                                        </td>
                                    </tr>
                                ))}

                                {!users.data.length && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {users.links?.length ? (
                        <div className="card-footer">
                            <nav>
                                <ul className="pagination mb-0">
                                    {users.links.map((l, i) => (
                                        <li
                                            key={i}
                                            className={`page-item ${l.active ? "active" : ""} ${!l.url ? "disabled" : ""}`}
                                        >
                                            <button
                                                type="button"
                                                className="page-link"
                                                onClick={() => goTo(l.url)}
                                                dangerouslySetInnerHTML={{ __html: l.label }}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

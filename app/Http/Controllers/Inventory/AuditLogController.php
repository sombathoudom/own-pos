<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $table = $request->string('table')->toString();

        $logs = AuditLog::query()
            ->with('user')
            ->when($search !== '', fn ($q) => $q->where('action', 'like', "%{$search}%"))
            ->when($table !== '', fn ($q) => $q->where('table_name', $table))
            ->orderByDesc('created_at')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('inventory/audit-logs/index', [
            'logs' => $logs,
            'filters' => [
                'search' => $search,
                'table' => $table,
            ],
        ]);
    }
}

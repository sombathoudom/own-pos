<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::updated(function (Model $model) {
            $changes = $model->getChanges();
            $original = $model->getOriginal();

            if (empty($changes)) {
                return;
            }

            $oldValues = [];
            $newValues = [];

            foreach ($changes as $key => $newValue) {
                if (in_array($key, ['created_at', 'updated_at'])) {
                    continue;
                }
                $oldValues[$key] = $original[$key] ?? null;
                $newValues[$key] = $newValue;
            }

            if (empty($newValues)) {
                return;
            }

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'updated',
                'table_name' => $model->getTable(),
                'record_id' => $model->getKey(),
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
            ]);
        });

        static::deleted(function (Model $model) {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'deleted',
                'table_name' => $model->getTable(),
                'record_id' => $model->getKey(),
                'old_values' => $model->getAttributes(),
                'new_values' => null,
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
            ]);
        });
    }
}

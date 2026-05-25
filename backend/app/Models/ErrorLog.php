<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ErrorLog extends Model
{
    protected $fillable = [
        'user_id',
        'method',
        'path',
        'status_code',
        'exception_class',
        'message',
        'file',
        'line',
        'ip_address',
        'user_agent',
        'trace',
    ];

    protected function casts(): array
    {
        return [
            'status_code' => 'integer',
            'line' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Priorities extends Model
{
    protected $fillable = [
        'report_id',
        'identifications',
        'root_problems',
        'fixing_activities',
        'implementation_activities'
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class, 'report_id');
    }
}

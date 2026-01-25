<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RktRecommendation extends Model
{
    protected $fillable = [
        'report_id',
        'identification',
        'root_problem',
        'activity',
        'implementation_description',
        'is_require_cost',
    ];

    protected $casts = [
        'is_require_cost' => 'boolean',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class, 'report_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rkt extends Model
{
    protected $fillable = [
        'report_id',
        'identification',
        'root_problem',
        'fixing_activity',
        'fixing_activity_recommendation',
        'implementation_activity',
        'is_require_cost',
        'priorities_identification_score',
        'priorities_root_problem_score',
        'priorities_fixing_activity_score',
        'priorities_implementation_activity_score',
        'priorities_score',
        'aggregates_identification_score',
        'aggregates_root_problem_score',
        'aggregates_fixing_activity_score',
        'aggregates_implementation_activity_score',
        'aggregates_score'
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class, 'report_id');
    }
}

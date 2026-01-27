<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Arkas extends Model
{
    protected $table = 'arkas';

    protected $fillable = [
        'report_id',
        'fixing_activity',
        'implementation_description',
        'arkas_activity',
        'arkas_activity_description',
        'budget_month',
        'quantity',
        'unit',
        'unit_price',
        'total_price',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    protected $fillable = [
        'year',
        'user_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function rkts(): HasMany
    {
        return $this->hasMany(Rkt::class, 'report_id', 'id');
    }

    public function priorities(): HasMany
    {
        return $this->hasMany(Priorities::class, 'report_id', 'id');
    }

    public function aggregates(): HasMany
    {
        return $this->hasMany(Aggregates::class, 'report_id', 'id');
    }
}

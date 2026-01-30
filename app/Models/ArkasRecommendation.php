<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArkasRecommendation extends Model
{
    protected $table = 'arkas_recommendation';
    protected $guarded = ['id'];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }
}

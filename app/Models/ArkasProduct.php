<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArkasProduct extends Model
{
    protected $fillable = [
        'product_code',
        'product_name',
        'unit',
        'max_price',
    ];
}

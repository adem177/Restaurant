<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One selectable choice inside a group, with the price added to the
     * product base price (can be 0 for things like "sans sucre").
     */
    public function up(): void
    {
        Schema::create('product_option_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_option_group_id')->constrained('product_option_groups')->cascadeOnDelete();
            $table->string('name_fr');
            $table->string('name_en');
            $table->string('name_ar');
            $table->decimal('price_delta', 8, 2)->default(0);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['product_option_group_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_option_values');
    }
};

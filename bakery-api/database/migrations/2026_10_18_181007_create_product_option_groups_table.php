<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A selectable group of options on a product, e.g. "Taille" (single,
     * required) or "Extras" (multi, optional).
     */
    public function up(): void
    {
        Schema::create('product_option_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name_fr');
            $table->string('name_en');
            $table->string('name_ar');
            // single = radio (exactly one), multi = checkboxes (0..n).
            $table->string('selection', 16)->default('single');
            $table->boolean('is_required')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['product_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_option_groups');
    }
};

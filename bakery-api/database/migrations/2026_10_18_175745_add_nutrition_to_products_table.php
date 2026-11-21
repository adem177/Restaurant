<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-portion nutrition facts. All values are optional: a NULL column
     * simply means the value is not published for that product.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedSmallInteger('calories')->nullable()->after('stock');
            $table->decimal('carbs_g', 6, 1)->nullable()->after('calories');
            $table->decimal('fat_g', 6, 1)->nullable()->after('carbs_g');
            $table->decimal('protein_g', 6, 1)->nullable()->after('fat_g');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['calories', 'carbs_g', 'fat_g', 'protein_g']);
        });
    }
};

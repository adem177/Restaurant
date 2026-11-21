<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Snapshot of the options chosen on one order line. Labels and deltas are
     * copied so a historical order stays readable even if the menu changes.
     */
    public function up(): void
    {
        Schema::create('order_item_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            // Kept for reference; nulled out if the option is ever deleted.
            $table->foreignId('product_option_value_id')->nullable()
                ->constrained('product_option_values')->nullOnDelete();
            $table->string('group_name_fr');
            $table->string('group_name_en');
            $table->string('group_name_ar');
            $table->string('name_fr');
            $table->string('name_en');
            $table->string('name_ar');
            $table->decimal('price_delta', 8, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_item_options');
    }
};

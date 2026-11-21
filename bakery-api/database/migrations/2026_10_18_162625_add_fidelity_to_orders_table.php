<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('subtotal', 10, 2)->nullable()->after('total');
            $table->decimal('discount', 10, 2)->default(0)->after('subtotal');
            $table->string('promo_code', 40)->nullable()->after('discount');
            $table->unsignedInteger('points_redeemed')->default(0)->after('promo_code');
            $table->unsignedInteger('points_earned')->default(0)->after('points_redeemed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'discount', 'promo_code', 'points_redeemed', 'points_earned']);
        });
    }
};

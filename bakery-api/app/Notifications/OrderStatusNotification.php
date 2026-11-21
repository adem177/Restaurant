<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the client whenever an admin changes their order status.
 * The copy is rendered in the account language (users.locale).
 */
class OrderStatusNotification extends Notification
{
    use Queueable;

    /**
     * Status => [fr, en, ar] subject/body pairs.
     *
     * @var array<string, array<string, string>>
     */
    private const COPY = [
        'pending' => [
            'fr' => 'Commande reçue',
            'en' => 'Order received',
            'ar' => 'تم استلام الطلب',
        ],
        'confirmed' => [
            'fr' => 'Commande confirmée',
            'en' => 'Order confirmed',
            'ar' => 'تم تأكيد الطلب',
        ],
        'ready' => [
            'fr' => 'Commande prête',
            'en' => 'Order ready',
            'ar' => 'الطلب جاهز',
        ],
        'completed' => [
            'fr' => 'Commande terminée',
            'en' => 'Order completed',
            'ar' => 'اكتمل الطلب',
        ],
        'cancelled' => [
            'fr' => 'Commande annulée',
            'en' => 'Order cancelled',
            'ar' => 'تم إلغاء الطلب',
        ],
    ];

    public function __construct(public Order $order) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $this->resolveLocale($notifiable);
        $status = $this->order->status;
        $label = self::COPY[$status][$locale] ?? $status;
        $recipient = $this->order->customer_name;
        $url = url('/account');

        $mail = (new MailMessage)
            ->subject("{$label} — Happy Plate")
            ->greeting($this->greeting($locale, $recipient))
            ->line($this->line($locale, $label))
            ->line("{$this->orderNumberLabel($locale)} #{$this->order->id}")
            ->line($this->totalLabel($locale).' '.number_format((float) $this->order->total, 2).' DT')
            ->action($this->ctaLabel($locale), $url)
            ->salutation($this->salutation($locale));

        return $mail;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'status' => $this->order->status,
        ];
    }

    private function resolveLocale(object $notifiable): string
    {
        $locale = $notifiable->locale ?? 'fr';

        return in_array($locale, ['fr', 'en', 'ar'], true) ? $locale : 'fr';
    }

    private function greeting(string $locale, string $name): string
    {
        return match ($locale) {
            'en' => "Hello {$name},",
            'ar' => "مرحباً {$name}،",
            default => "Bonjour {$name},",
        };
    }

    private function line(string $locale, string $label): string
    {
        return match ($locale) {
            'en' => "Here is an update on your order: {$label}.",
            'ar' => "تحديث حول طلبك: {$label}.",
            default => "Voici une mise à jour de votre commande : {$label}.",
        };
    }

    private function orderNumberLabel(string $locale): string
    {
        return match ($locale) {
            'en' => 'Order number',
            'ar' => 'رقم الطلب',
            default => 'Numéro de commande',
        };
    }

    private function totalLabel(string $locale): string
    {
        return match ($locale) {
            'en' => 'Total:',
            'ar' => 'المجموع:',
            default => 'Total :',
        };
    }

    private function ctaLabel(string $locale): string
    {
        return match ($locale) {
            'en' => 'View my orders',
            'ar' => 'عرض طلباتي',
            default => 'Voir mes commandes',
        };
    }

    private function salutation(string $locale): string
    {
        return match ($locale) {
            'en' => 'The Happy Plate team 🍽️',
            'ar' => 'فريق هابي بلايت 🍽️',
            default => 'L\'équipe Happy Plate 🍽️',
        };
    }
}

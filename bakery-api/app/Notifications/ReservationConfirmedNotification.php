<?php

namespace App\Notifications;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReservationConfirmedNotification extends Notification
{
    use Queueable;

    public function __construct(public Reservation $reservation) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $reservation = $this->reservation;

        return (new MailMessage)
            ->subject('Réservation confirmée — Happy Plate | تم تأكيد الحجز')
            ->greeting("Bonjour {$reservation->name}, | مرحباً {$reservation->name}،")
            ->line('Votre réservation est confirmée. Voici les détails :')
            ->line("📅 Date : {$reservation->date->format('d/m/Y')}")
            ->line("🕐 Heure : {$reservation->time}")
            ->line("👥 Nombre de personnes : {$reservation->guests}")
            ->line("📞 Contact : {$reservation->phone}")
            ->line('')
            ->line("تم تأكيد حجزك. التفاصيل: {$reservation->date->format('d/m/Y')} — {$reservation->time} — {$reservation->guests} أشخاص")
            ->action('Voir notre menu', url('/menu'))
            ->line('Merci de votre confiance ! نشكركم على ثقتكم')
            ->salutation('L\'équipe Happy Plate 🍽️');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'reservation_id' => $this->reservation->id,
        ];
    }
}

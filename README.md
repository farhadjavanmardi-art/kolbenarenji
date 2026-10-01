# Kolbe Narenji — Buchung und Verwaltung einer Ferienunterkunft

> Umgesetzt mit dem KI-Werkzeug Claude Code (No-Code). Anforderungen, Fachinhalte und Prüfung: Farhad Javanmardi.

Buchungs- und Verwaltungsanwendung für ein Gartenhaus im Dorf Qalat bei Schiras.
Im realen Einsatz: Gäste buchen darüber, die Vermietung wird darüber abgewickelt.

**Live:** [kolbenarenji.com](https://kolbenarenji.com)

## Was die Anwendung kann

- **Buchung mit persischem Kalender.** Belegte Nächte kommen aus der Datenbank
  und sind im Kalender gesperrt. Der Gast wählt Anreise und Abreise, die Zahl
  der Gäste und lädt den Beleg über die Kaution hoch.
- **Preisberechnung auf dem Server.** Maßgeblich ist die Tabelle `pricing`; ein
  Trigger legt den gespeicherten Preis fest. Die Seite zeigt den Preis nur an,
  sie bestimmt ihn nicht — sonst ließe er sich im Browser ändern. Der
  Wochenendpreis gilt nur für die Nacht, die am Donnerstag beginnt.
- **Rabatte mit Vorankündigung.** Ein laufender Rabatt steht auf den
  Preiskarten, ein kommender wird angekündigt.
- **Adminbereich** mit Anmeldung: Buchungen bestätigen, ändern, löschen,
  Notizen führen, Ausgaben erfassen, die Nachricht an den Gast für WhatsApp
  oder Telegram vorbereiten.
- **Übergabeformular** für Ein- und Auszug: Zustand je Position, Notiz, Foto,
  und beim Auszug die Gegenüberstellung „vorher / nachher".
- **Automatische Beiträge** auf Instagram und Telegram über n8n, mit
  Bildzuschnitt für Feed und Story.
- **Gold Intelligence** unter [kolbenarenji.com/gold](https://kolbenarenji.com/gold):
  Entscheidungshilfe für den Goldmarkt aus realen Marktdaten, jede Zahl mit
  Quelle und Datum.
- **5 Pollar** unter [kolbenarenji.com/5p](https://kolbenarenji.com/5p):
  Unternehmensanalyse in fünf Säulen (Machbarkeit, Businessplan, Marketing,
  Betriebshandbuch, Finanzplan) mit Fortschrittsplan. Die Zahlen rechnet die
  Seite selbst; die Texte schreibt Claude mit dem API-Schlüssel des Besuchers,
  der nur in dessen Browser bleibt. Quellcode: [5p](https://github.com/farhadjavanmardi-art/5p).
- **Persisch und Englisch**, rechts nach links, ohne Nachladen der Seite.

## Technik

Statisches HTML, CSS und JavaScript ohne Build, ausgeliefert über Vercel.
Daten, Anmeldung, Dateiablage und Serverfunktionen über Supabase (Postgres mit
Row Level Security, Auth, Storage, Edge Functions). Automatisierung über n8n.

## Umgang mit Gastdaten

Gastdaten liegen ausschließlich in der Datenbank, nie im Quelltext und nie in
diesem Repository.

- Buchungen sind nur für angemeldete Verwaltungskonten lesbar (`is_admin()` in
  der Lesepolicy). Anonyme Besucher dürfen eine Buchung anlegen und über die
  Funktion `get_blocked_ranges` die belegten Tage abfragen — mehr nicht.
- Ausweisfotos, Zahlungsbelege und Übergabefotos liegen in geschlossenen
  Buckets. Gespeichert wird nur der Pfad; angezeigt werden sie über eine
  Adresse, die nach kurzer Zeit verfällt.
- Die Bankverbindung steht in der Tabelle `bankverbindung`. Anonyme Besucher
  sehen davon nur das Konto für die Kaution, das sie zum Zahlen brauchen.

## Seiten

| Datei | Adresse | Zweck |
|---|---|---|
| `index.html` | [/](https://kolbenarenji.com) | Startseite und Buchung |
| `admin.html` | [/admin](https://kolbenarenji.com/admin) | Verwaltung (Anmeldung nötig) |
| `checkin.html` | [/checkin](https://kolbenarenji.com/checkin) | Übergabeformular (Anmeldung nötig) |
| `dashboard-6p.html` | [/dashboard-6p](https://kolbenarenji.com/dashboard-6p) | Kennzahlen (Anmeldung nötig) |
| `5p.html` | [/5p](https://kolbenarenji.com/5p) | 5 Pollar: Unternehmensanalyse (Erzeugt aus dem Repository `5p`) |
| `gold.html` | [/gold](https://kolbenarenji.com/gold) | Gold Intelligence — eigenes Repository: [farhadjavanmardi-art/gold](https://github.com/farhadjavanmardi-art/gold) |
| `panel.html` | [/panel](https://kolbenarenji.com/panel) | Einstieg zu den Bereichen |
| `crm.html` | [/crm](https://kolbenarenji.com/crm) | Kundenverwaltung, noch nicht angeschlossen |

---

# کلبه نارنجی — سایت رزرو ویلا

سایت رزرو ویلای کلبه نارنجی در روستای قلات شیراز.

**آدرس سایت:** [kolbenarenji.com](https://kolbenarenji.com)

## فایل‌ها
- `index.html` — صفحه اصلی و فرم رزرو
- `admin.html` — پنل مدیریت (نیازمند ورود)
- `checkin.html` — فرم تحویل و تحول (نیازمند ورود)
- `dashboard-6p.html` — داشبورد شاخص‌ها (نیازمند ورود)
- `gold.html` — Gold Intelligence (مخزن جداگانه: [farhadjavanmardi-art/gold](https://github.com/farhadjavanmardi-art/gold))
- `panel.html` — صفحه لانچر
- `crm.html` — مدیریت مشتریان (هنوز به دیتابیس وصل نیست)

## آدرس‌ها
- صفحه اصلی: [kolbenarenji.com](https://kolbenarenji.com)
- پنل مدیریت: [kolbenarenji.com/admin](https://kolbenarenji.com/admin)
- فرم تحویل: [kolbenarenji.com/checkin](https://kolbenarenji.com/checkin)
- لانچر: [kolbenarenji.com/panel](https://kolbenarenji.com/panel)
- CRM: [kolbenarenji.com/crm](https://kolbenarenji.com/crm)

## دربارهٔ داده‌های مهمان‌ها

اطلاعات مهمان‌ها فقط در دیتابیس است، نه در کد و نه در این مخزن. رزروها فقط
برای حساب مدیر واردشده خواندنی‌اند؛ بازدیدکنندهٔ ناشناس تنها می‌تواند رزرو ثبت
کند و روزهای پر را ببیند. عکس مدارک، فیش پرداخت و عکس‌های تحویل در سطل‌های
بسته نگهداری می‌شوند و فقط با لینک موقت نمایش داده می‌شوند. شمارهٔ حساب هم در
جدول `bankverbindung` است، نه در کد.

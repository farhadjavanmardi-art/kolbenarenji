# 🏗️ سند مادر کلبه نارنجی + سیستم 6P (نسخه یکپارچه)

> این سند، معماری فنی کلبه نارنجی (PROJECT_BLUEPRINT.md نسخه ۴) را با سیستم کسب‌وکاری 6P (فایل 6P_kolbe_narenji.docx) یکپارچه می‌کند و نقشهٔ داشبورد تحلیلی ۶ بخشی را مشخص می‌سازد.

---

## بخش ۱ — نگاشت 6P روی زیرساخت موجود کلبه نارنجی

| # | بخش 6P | منبع داده زنده (Supabase) | وضعیت |
|---|--------|---------------------------|--------|
| 1 | Feasibility Study | `reservations` (اشغال، ROI محاسبه‌شده) | نیمه‌زنده — اعداد هدف ثابت، اشغال واقعی از دیتابیس |
| 2 | Business Plan | `reservations` + `expenses` (درآمد/هزینه/سود ماهانه) | زنده |
| 3 | Marketing Plan | ندارد در schema فعلی — نیاز به جدول جدید `marketing_kpi` یا ورود دستی | دستی |
| 4 | Customer Experience Plan | `checkins` (بازخورد) + آیندهٔ جدول `feedback` | نیمه‌زنده |
| 5 | AI Integration Plan | مصرف Anthropic API (لاگ n8n) — قابل اتصال به `app_config` | دستی/آینده |
| 6 | Digital Strategy Plan | آمار اینستاگرام (Workflow 6 گزارش روزانه) | زنده از طریق n8n |

**نتیجه:** بخش‌های ۲ (Business) کاملاً به رزروهای واقعی وصل است. بقیه یا نیاز به جدول جدید دارند یا فعلاً KPI هدف/دستی نمایش می‌دهند تا داده واقعی جمع شود.

---

## بخش ۲ — جدول‌های جدید پیشنهادی برای اتصال کامل 6P

```sql
-- KPI بازاریابی (ورود دستی ماهانه از Instagram Insights/Google)
create table if not exists public.marketing_kpi (
  id uuid primary key default gen_random_uuid(),
  month date not null,              -- اول هر ماه
  followers integer,
  engagement_rate numeric,
  reach integer,
  direct_to_booking_rate numeric,
  ad_spend bigint,
  created_at timestamptz default now()
);

-- بازخورد مهمان (برای CX)
create table if not exists public.guest_feedback (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id),
  csat integer,             -- 1 تا 10
  nps integer,              -- -100 تا 100
  comment text,
  created_at timestamptz default now()
);

-- لاگ مصرف AI (برای بخش ۵)
create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  date date default current_date,
  tokens_in integer,
  tokens_out integer,
  cost_usd numeric,
  purpose text  -- 'content' | 'chat_assistant' | 'comment_reply'
);
```

grant/RLS مشابه بخش ۲.۵ سند مادر فنی (anon select، service role write برای جداول حساس).

---

## بخش ۳ — تابع‌های محاسباتی برای داشبورد

```sql
-- خلاصه ماهانه Business Plan (بخش ۲ از ۶P)
create or replace function public.monthly_business_summary(p_month date)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'nights_booked', coalesce(sum(nights) filter (where status='confirmed'),0),
    'revenue', coalesce(sum(total_price) filter (where status='confirmed'),0),
    'reservations_count', count(*) filter (where status='confirmed'),
    'occupancy_pct', round(coalesce(sum(nights) filter (where status='confirmed'),0)::numeric
        / extract(day from (date_trunc('month',p_month) + interval '1 month - 1 day')) * 100, 1)
  )
  from reservations
  where check_in >= date_trunc('month', p_month)
    and check_in < date_trunc('month', p_month) + interval '1 month';
$$;
grant execute on function public.monthly_business_summary(date) to anon, authenticated;
```

---

## بخش ۴ — ساختار داشبورد ۶P (dashboard-6p.html)

فایل تک‌صفحه‌ای، هم‌راستا با تم موجود admin.html (مشکی #0A0A0B + نارنجی #FF7A1A، فونت Vazirmatn، RTL).

**۶ تب:**
1. **امکان‌سنجی** — ROI هدف vs واقعی، نقطه سر‌به‌سر، اشغال
2. **کسب‌وکار** — درآمد/هزینه/سود ماهانه (زنده از Supabase)، نمودار روند
3. **بازاریابی** — فالوور، تعامل، بودجه تبلیغ (ورود دستی + ذخیره localStorage تا جدول ساخته شود)
4. **تجربه مشتری** — CSAT/NPS (ورود دستی فعلاً)
5. **هوش مصنوعی** — مصرف توکن/هزینه API (ورود دستی فعلاً)
6. **دیجیتال** — چک‌لیست زیرساخت (سایت/n8n/Vercel) + لینک مستقیم به admin.html

هر KPI هدف از سند 6P (مثلاً ۲۰ شب/ماه، ۶۰ میلیون درآمد، ROI ۹۰٪) به‌صورت ثابت در کد کنار عدد واقعی نمایش داده می‌شود تا فاصلهٔ هدف-تا-واقعیت دیده شود.

فایل HTML همراه این سند ساخته شده: `dashboard-6p.html`

---

## بخش ۵ — چک‌لیست اتصال نهایی

```
[ ] ۱. اجرای ۳ جدول جدید (بخش ۲) در Supabase کلبه نارنجی
[ ] ۲. اجرای تابع monthly_business_summary
[ ] ۳. آپلود dashboard-6p.html در ریشهٔ سایت (کنار admin.html)
[ ] ۴. اتصال SUPABASE_URL + anon key کلبه (از CREDENTIALS_SECRET.md) در بالای فایل
[ ] ۵. لینک داشبورد در panel.html (لانچر) اضافه شود
[ ] ۶. برای بخش‌های دستی (بازاریابی/CX/AI)، هر ماه اعداد Instagram Insights + بازخورد QR وارد شود
[ ] ۷. بعداً: workflow n8n برای پر کردن خودکار marketing_kpi از آمار اینستاگرام (Workflow 6 موجود قابل توسعه است)
```

---

*این سند مکمل PROJECT_BLUEPRINT.md است؛ برای جزئیات فنی (اینستاگرام، n8n، عکس مرجع و...) همان سند مرجع اصلی باقی می‌ماند.*

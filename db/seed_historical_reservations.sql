-- Historical reservations imported from the original Excel tracking sheet ("عملاء الأستاذ سلمان").
-- Verified against that file's own "ملخص الأرباح" summary totals before import:
-- 16 reservations, 89 nights, 37,550 SAR rent, 3,450 SAR commission, 3,259 SAR cleaning/maintenance, 30,841 SAR net.
-- Partner shares below are computed at CURRENT ownership % (this repo's confirmed split), not necessarily
-- what was informally tracked at the time -- run this only once, on a freshly migrated + seeded database.
do $$
declare
  v_reservation_id uuid;
  v_salman uuid := (select id from partners where name = 'Salman');
  v_hakeem uuid := (select id from partners where name = 'Hakeem');
  v_abdulaziz uuid := (select id from partners where name = 'Abdulaziz');
  v_basmah uuid := (select id from partners where name = 'Basmah');
begin

  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'حنان الأحمدي', 'direct', 'monthly', '2025-07-30', '2025-08-29', 3000, 3000,
    'bank_transfer', 'flat_amount', null, 500, 205, 'نظافة الشقة 170 + مستلزمات 35',
    2295, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 985.2),
    (v_reservation_id, v_hakeem, 42.928111, 985.2),
    (v_reservation_id, v_abdulaziz, 9.429185, 216.4),
    (v_reservation_id, v_basmah, 4.714593, 108.2);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'عبدالله القحطاني', 'direct', 'daily', '2025-11-22', '2025-11-23', 350, 350,
    'cash', 'flat_amount', null, 50, 750, 'نظافة 100 + شراء لحافات 650',
    -450, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, -193.18),
    (v_reservation_id, v_hakeem, 42.928111, -193.18),
    (v_reservation_id, v_abdulaziz, 9.429185, -42.43),
    (v_reservation_id, v_basmah, 4.714593, -21.21);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'علي الشيباني', 'direct', 'daily', '2025-11-26', '2025-11-27', 400, 400,
    'cash', 'flat_amount', null, 50, 85, 'نظافة 60 + غسيل مفارش 25',
    265, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 113.76),
    (v_reservation_id, v_hakeem, 42.928111, 113.76),
    (v_reservation_id, v_abdulaziz, 9.429185, 24.99),
    (v_reservation_id, v_basmah, 4.714593, 12.49);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'عبد الحكيم', 'direct', 'daily', '2025-12-24', '2025-12-26', 1300, 1300,
    'cash', 'flat_amount', null, 100, 136, 'نظافة 100 + غسيل مفارش 36',
    1064, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 456.76),
    (v_reservation_id, v_hakeem, 42.928111, 456.76),
    (v_reservation_id, v_abdulaziz, 9.429185, 100.33),
    (v_reservation_id, v_basmah, 4.714593, 50.15);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'ماجد', 'direct', 'daily', '2025-12-26', '2025-12-28', 600, 600,
    'bank_transfer', 'flat_amount', null, 100, 136, 'نظافة 100 + غسيل مفارش 36',
    364, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 156.26),
    (v_reservation_id, v_hakeem, 42.928111, 156.26),
    (v_reservation_id, v_abdulaziz, 9.429185, 34.32),
    (v_reservation_id, v_basmah, 4.714593, 17.16);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'مدثر', 'direct', 'daily', '2025-12-31', '2026-01-05', 2500, 2500,
    'bank_transfer', 'flat_amount', null, 250, 337, 'نظافة 100 + غسيل 27 + كالون باب 60 + فتح باب 50 + مشتريات 100',
    1913, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 821.21),
    (v_reservation_id, v_hakeem, 42.928111, 821.21),
    (v_reservation_id, v_abdulaziz, 9.429185, 180.38),
    (v_reservation_id, v_basmah, 4.714593, 90.2);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'ماجد العسيري', 'direct', 'daily', '2025-01-09', '2025-01-16', 2500, 2500,
    'bank_transfer', 'flat_amount', null, 350, 186, 'نظافة 100 + غسيل مفارش 36 + مستلزمات 50',
    1964, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 843.11),
    (v_reservation_id, v_hakeem, 42.928111, 843.11),
    (v_reservation_id, v_abdulaziz, 9.429185, 185.19),
    (v_reservation_id, v_basmah, 4.714593, 92.59);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'فاطمة عطية', 'direct', 'daily', '2026-02-18', '2026-02-22', 2600, 2600,
    'cash', 'flat_amount', null, 200, 161, 'نظافة 125 + غسيل مفارش 36',
    2239, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 961.16),
    (v_reservation_id, v_hakeem, 42.928111, 961.16),
    (v_reservation_id, v_abdulaziz, 9.429185, 211.12),
    (v_reservation_id, v_basmah, 4.714593, 105.56);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'صالح الصيعري', 'direct', 'daily', '2026-02-23', '2026-02-27', 2600, 2600,
    'bank_transfer', 'flat_amount', null, 200, 136, 'نظافة 100 + غسيل مفارش 36',
    2264, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 971.89),
    (v_reservation_id, v_hakeem, 42.928111, 971.89),
    (v_reservation_id, v_abdulaziz, 9.429185, 213.48),
    (v_reservation_id, v_basmah, 4.714593, 106.74);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'حسن عسيري', 'direct', 'daily', '2026-02-28', '2026-03-06', 3000, 3000,
    'bank_transfer', 'flat_amount', null, 300, 136, 'نظافة + غسيل مفارش 136',
    2564, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 1100.68),
    (v_reservation_id, v_hakeem, 42.928111, 1100.68),
    (v_reservation_id, v_abdulaziz, 9.429185, 241.76),
    (v_reservation_id, v_basmah, 4.714593, 120.88);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'عبدالملك اليحيا', 'direct', 'daily', '2026-03-08', '2026-03-21', 12000, 12000,
    'bank_transfer', 'flat_amount', null, 650, 136, 'نظافة + غسيل مفارش 136',
    11214, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 4813.96),
    (v_reservation_id, v_hakeem, 42.928111, 4813.96),
    (v_reservation_id, v_abdulaziz, 9.429185, 1057.39),
    (v_reservation_id, v_basmah, 4.714593, 528.69);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'محمد العسيري', 'direct', 'daily', '2026-04-21', '2026-04-25', 1600, 1600,
    null, 'flat_amount', null, 200, 136, 'تنظيف + غسيل شراشف 136',
    1264, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 542.61),
    (v_reservation_id, v_hakeem, 42.928111, 542.61),
    (v_reservation_id, v_abdulaziz, 9.429185, 119.18),
    (v_reservation_id, v_basmah, 4.714593, 59.6);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'منصور ال ياسين', 'direct', 'daily', '2026-04-26', '2026-04-28', 1000, 1000,
    null, 'flat_amount', null, 100, 136, 'تنظيف + غسيل شراشف 136',
    764, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 327.97),
    (v_reservation_id, v_hakeem, 42.928111, 327.97),
    (v_reservation_id, v_abdulaziz, 9.429185, 72.04),
    (v_reservation_id, v_basmah, 4.714593, 36.02);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'بدر الجدعان', 'direct', 'daily', '2026-04-30', '2026-05-02', 1000, 1000,
    null, 'flat_amount', null, 100, 136, 'تنظيف + غسيل شراشف 136',
    764, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 327.97),
    (v_reservation_id, v_hakeem, 42.928111, 327.97),
    (v_reservation_id, v_abdulaziz, 9.429185, 72.04),
    (v_reservation_id, v_basmah, 4.714593, 36.02);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'عبدالوهاب الشيخ', 'direct', 'daily', '2026-05-30', '2026-06-03', 2400, 2400,
    null, 'flat_amount', null, 200, 311, 'تنظيف + غسيل شراشف 161 + أدوات سلامة 150',
    1889, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 810.91),
    (v_reservation_id, v_hakeem, 42.928111, 810.91),
    (v_reservation_id, v_abdulaziz, 9.429185, 178.12),
    (v_reservation_id, v_basmah, 4.714593, 89.06);


  insert into reservations (
    guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
    payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
    net_amount, status, notes, created_by
  ) values (
    'حسن عسيري', 'direct', 'daily', '2026-06-23', '2026-06-25', 700, 700,
    null, 'flat_amount', null, 100, 136, 'تنظيف + غسيل شراشف 136',
    464, 'completed', null, null
  ) returning id into v_reservation_id;

  insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount) values
    (v_reservation_id, v_salman, 42.928111, 199.19),
    (v_reservation_id, v_hakeem, 42.928111, 199.19),
    (v_reservation_id, v_abdulaziz, 9.429185, 43.75),
    (v_reservation_id, v_basmah, 4.714593, 21.87);

end $$;

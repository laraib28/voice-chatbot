-- Default settings — update values via admin panel after setup
insert into settings (key, value) values
  ('institute_name',      'SpecKit Learning'),
  ('contact_email',       'info@example.com'),
  ('contact_phone',       '+92 300 0000000'),
  ('operating_hours',     'Monday to Friday, 9 AM – 6 PM'),
  ('escalation_message',  'For further assistance, please contact our team directly.')
on conflict (key) do nothing;

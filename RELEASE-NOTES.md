# Release notes

## 2026-10-12

- Owner employee contract drafts with editing and printing. Review terms before signing.
- Reversible deletion and restoration of issued salary slips, reflected in financial totals.
- Owner corrections to customer names and phone numbers with audit history.
- Faster repeat-customer entry by plate or phone, reusing vehicle and base wash package.

Production uses Cloudflare Workers and D1.
Run `npm run build:cloudflare` and `npm run deploy:cloudflare`.
The deploy command applies pending D1 migrations before publishing the Worker.
This release requires migration `0009_employee_contracts_salary_archive.sql`.
No new environment variables are required.

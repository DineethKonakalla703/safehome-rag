# AI-assisted Bulk Import

Only Main Admin can use block and resident Excel onboarding.

## Expected columns

Required: `flat_number`, `floor_number`, `resident_name`, `phone`.

Optional: `email`, `resident_type`, `ownership_type`, `move_in_date`, `parking_slot`, `vehicle_number`.

## Two-step flow

1. `POST /api/import/preview-block-residents` accepts an Excel file and block name. It validates columns, required values, phone, email, enums and duplicates. No CRM records are created.
2. The UI displays valid rows, error rows, warnings and counts.
3. `POST /api/import/confirm-block-residents` with `confirm: true` creates only the validated records through backend models and writes an audit event.

Imports expire after 24 hours. Existing blocks may be reused after the preview warning; duplicate apartments and residents are skipped.

-- One-time owner credential reset requested by the owner. The replacement PIN is a runtime secret.
DELETE FROM pin_settings WHERE scope = 'owner';
--> statement-breakpoint
DELETE FROM pin_sessions WHERE scope = 'owner';

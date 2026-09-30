import {sql} from 'drizzle-orm';
import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const jobs=sqliteTable('jobs',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),plate:text('plate').notNull(),vehicle:text('vehicle').notNull(),
 category:text('category').notNull().default('mobil'),customerName:text('customer_name').notNull().default(''),phone:text('phone').notNull().default(''),washType:text('wash_type').notNull().default(''),brand:text('brand').notNull().default(''),color:text('color').notNull().default(''),
 voidedAt:integer('voided_at'),voidReason:text('void_reason').notNull().default(''),
 groupId:text('group_id').notNull().default(''),estimatedAt:integer('estimated_at'),amount:integer('amount'),paidAt:integer('paid_at'),paymentMethod:text('payment_method').notNull().default(''),
 status:integer('status').notNull().default(0),created:integer('created').notNull(),updated:integer('updated').notNull()
},t=>[index('idx_jobs_owner_created').on(t.owner,t.created),index('idx_jobs_plate_lookup').on(sql`UPPER(REPLACE(${t.plate},' ',''))`),index('idx_jobs_group').on(t.groupId),index('idx_jobs_phone').on(t.phone),index('idx_jobs_paid_at').on(t.paidAt)]);
export const pinSessions=sqliteTable('pin_sessions',{tokenHash:text('token_hash').primaryKey(),scope:text('scope').notNull(),expires:integer('expires').notNull()});
export const pinAttempts=sqliteTable('pin_attempts',{key:text('key').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});

export const pinSettings=sqliteTable('pin_settings',{scope:text('scope').primaryKey(),pinHash:text('pin_hash').notNull(),salt:text('salt').notNull(),updated:integer('updated').notNull()});

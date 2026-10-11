import {sql} from 'drizzle-orm';
import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
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

export const employees=sqliteTable('employees',{
 id:text('id').primaryKey(),name:text('name').notNull(),bank:text('bank').notNull(),account:text('account').notNull(),rate:integer('rate').notNull(),payType:text('pay_type').notNull().default('daily'),monthlyRate:integer('monthly_rate').notNull().default(0),
});
export const salaries=sqliteTable('salaries',{
 id:text('id').primaryKey(),employeeId:text('employee_id').notNull(),week:text('week').notNull(),date:text('date').notNull(),
 detail:text('detail').notNull(),total:integer('total').notNull(),paidAt:integer('paid_at'),version:integer('version').notNull().default(1),
},t=>[index('idx_salaries_paid').on(t.paidAt),uniqueIndex('idx_salaries_employee_week').on(t.employeeId,t.week)]);

export const jobEdits=sqliteTable('job_edits',{id:text('id').primaryKey(),jobId:text('job_id').notNull(),scope:text('scope').notNull(),before:text('before').notNull(),after:text('after').notNull(),reason:text('reason').notNull(),created:integer('created').notNull()},t=>[index('idx_job_edits_job').on(t.jobId,t.created)]);

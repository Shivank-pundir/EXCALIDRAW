#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/8f73fa3d3b8e11bb3b84c0ce14bca967bde474f9aee9a5216561682ed6debee4/contract';
import endContract from '../../snapshots/8f73fa3d3b8e11bb3b84c0ce14bca967bde474f9aee9a5216561682ed6debee4/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'chat',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('message', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('roomId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'room',
        columns: [
          col('adminId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['slug'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('photo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'chat',
        index: 'chat_roomId_idx_fe51d647',
        columns: ['roomId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'chat',
        index: 'chat_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'room',
        index: 'room_adminId_idx_530179db',
        columns: ['adminId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'chat',
        foreignKey: {
          name: 'chat_roomId_fkey',
          columns: ['roomId'],
          references: { schema: 'public', table: 'room', columns: ['slug'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'chat',
        foreignKey: {
          name: 'chat_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'room',
        foreignKey: {
          name: 'room_adminId_fkey',
          columns: ['adminId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

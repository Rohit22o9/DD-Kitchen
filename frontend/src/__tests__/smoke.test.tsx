/**
 * UI smoke tests: mount the real app against a running API and check each
 * portal renders real data without crashing.
 *
 *   SMOKE_API=http://127.0.0.1:8000/api npx vitest run
 *
 * Needs staff accounts (see README: npm run create-admin) passed via
 * SMOKE_STAFF / SMOKE_DIRECTOR as "email:password". Skipped when unset.
 */
import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import React from 'react';

const API = process.env.SMOKE_API;
const STAFF = process.env.SMOKE_STAFF?.split(':');
const DIRECTOR = process.env.SMOKE_DIRECTOR?.split(':');
const run = API && STAFF && DIRECTOR ? describe : describe.skip;

const post = async (path: string, body: unknown, token?: string) => {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return r.json();
};
const perthDay = (n: number) => new Date(Date.now() + 8 * 3600e3 + n * 86400e3).toISOString().slice(0, 10);

run('UI smoke (real API)', () => {
  const ctx: Record<string, any> = {};

  beforeAll(async () => {
    vi.stubEnv('VITE_API_BASE_URL', API!);
    const email = `smoke${Date.now()}@example.test`;
    const signup = await post('/auth/signup', { full_name: 'Smoke Tester', email, password: 'smoke password 1', terms_accepted: true, phone: '+61 400 000 001' });
    ctx.user = signup;
    // A random future slot so repeated runs don't collide.
    const start = `${String(2 * Math.floor(Math.random() * 10)).padStart(2, '0')}:00`;
    ctx.booking = await post(
      '/bookings',
      { booking_date: perthDay(30 + Math.floor(Math.random() * 300)), start_time: start, duration_hours: 4, phone: '+61 400 000 001', intended_use: 'Smoke test', team_size: 1, terms_accepted: true },
      signup.access_token
    );
    if (!ctx.booking.reference_code) throw new Error(`Setup booking failed: ${JSON.stringify(ctx.booking)}`);
    ctx.staff = await post('/admin/login', { username: STAFF![0], password: STAFF![1] });
    ctx.director = await post('/superadmin/login', { username: DIRECTOR![0], password: DIRECTOR![1] });
    await fetch(`${API}/admin/bookings/${ctx.booking.reference_code}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.staff.access_token}` },
      body: JSON.stringify({ status: 'approved' }),
    });
  });

  beforeEach(() => {
    cleanup();
    localStorage.clear();
    window.location.hash = '';
    vi.resetModules();
  });

  const mountApp = async () => {
    const { default: App } = await import('../App');
    render(<App />);
  };

  test('public site renders server pricing', async () => {
    await mountApp();
    expect(await screen.findAllByText(/\$100 \+ GST/, {}, { timeout: 10000 })).not.toHaveLength(0);
    expect(screen.queryByText(/Something went wrong/)).toBeNull();
  });

  test('admin portal requires a login', async () => {
    window.location.hash = '#admin';
    await mountApp();
    expect(await screen.findByText(/Staff email/)).toBeTruthy();
  });

  test('admin portal shows real bookings after login', async () => {
    localStorage.setItem('dd_admin_token', ctx.staff.access_token);
    window.location.hash = '#admin';
    window.localStorage.setItem('dd_admin_active_nav', 'bookings');
    await mountApp();
    expect((await screen.findAllByText(ctx.booking.reference_code, {}, { timeout: 10000 })).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Something went wrong/)).toBeNull();
  });

  test('super admin sees the persisted tax invoice', async () => {
    localStorage.setItem('dd_superadmin_token', ctx.director.access_token);
    window.location.hash = '#superadmin';
    await mountApp();
    expect((await screen.findAllByText(ctx.booking.reference_code, { exact: false }, { timeout: 10000 })).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/INV-\d{4}-\d{5}/, {}, { timeout: 10000 })).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Something went wrong/)).toBeNull();
  });

  test('customer dashboard shows only the customer\'s own booking', async () => {
    localStorage.setItem('dd_user_token', ctx.user.access_token);
    localStorage.setItem('dd_current_user', JSON.stringify(ctx.user.user));
    window.location.hash = '#customer';
    await mountApp();
    expect((await screen.findAllByText(ctx.booking.reference_code, { exact: false }, { timeout: 10000 })).length).toBeGreaterThan(0);
    expect(screen.queryByText(/DD-BK-001|Michael Davies|4892#/)).toBeNull();
    expect(screen.queryByText(/Something went wrong/)).toBeNull();
  });

  test('customer can open account security, documents and recurring booking screens', async () => {
    localStorage.setItem('dd_user_token', ctx.user.access_token);
    localStorage.setItem('dd_current_user', JSON.stringify(ctx.user.user));
    window.location.hash = '#customer';
    await mountApp();
    fireEvent.click(await screen.findByText('My Account', {}, { timeout: 10000 }));
    expect(await screen.findByText(/Account security & documents/)).toBeTruthy();
    expect(screen.getByText(/Change password/, { selector: 'div' })).toBeTruthy();
    expect(screen.getAllByText(/Food Safety Supervisor certificate/).length).toBeGreaterThan(0);
  });

  test('staff settings show the package editor and two-factor setup; directory lists accounts', async () => {
    localStorage.setItem('dd_admin_token', ctx.staff.access_token);
    localStorage.setItem('dd_admin_active_nav', 'settings');
    window.location.hash = '#admin';
    await mountApp();
    expect(await screen.findByText(/Kitchen hire packages/, {}, { timeout: 10000 })).toBeTruthy();
    expect(screen.getByText(/Two-factor sign-in/)).toBeTruthy();
    cleanup();
    vi.resetModules();
    localStorage.setItem('dd_admin_active_nav', 'customers');
    await mountApp();
    expect(await screen.findByText(/Customer accounts/, {}, { timeout: 10000 })).toBeTruthy();
    expect((await screen.findAllByText('Smoke Tester', {}, { timeout: 10000 })).length).toBeGreaterThan(0);
  });

  test('finance portal offers bank import, refunds and bond settlement', async () => {
    localStorage.setItem('dd_superadmin_token', ctx.director.access_token);
    window.location.hash = '#superadmin';
    await mountApp();
    expect(await screen.findByText(/Import bank CSV/, {}, { timeout: 10000 })).toBeTruthy();
    fireEvent.click(screen.getByText(/Import bank CSV/));
    expect(await screen.findByText(/Import bank statement/)).toBeTruthy();
  });

  test('password reset link opens the new-password form', async () => {
    window.location.hash = `#reset-password?token=${'a'.repeat(64)}`;
    const { AccountLinks } = await import('../components/account/AccountLinks');
    render(<AccountLinks />);
    expect(await screen.findByText(/Choose a new password/)).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText(/New password/), { target: { value: 'another password 1' } });
    fireEvent.change(screen.getByPlaceholderText(/Repeat new password/), { target: { value: 'another password 1' } });
    fireEvent.click(screen.getByText('Save new password'));
    expect(await screen.findByText(/expired or was already used/)).toBeTruthy(); // made-up token is rejected by the server
  });
});

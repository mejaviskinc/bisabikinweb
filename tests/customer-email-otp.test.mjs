import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const customer = readFileSync('static-source/lib/customer.ts', 'utf8');
const buyer = readFileSync('static-source/features/BuyerDashboard.tsx', 'utf8');
const email = readFileSync('docs/templates/customer-otp.html', 'utf8');
const signupEmail = readFileSync('docs/templates/customer-signup-otp.html', 'utf8');

test('OTP request never creates an unregistered account', () => {
  assert.match(customer, /request\('\/auth\/v1\/otp'/);
  assert.match(customer, /create_user:\s*false/);
});

test('6-digit OTP is verified server-side before a session is saved', () => {
  assert.match(customer, /if \(!\/\^\\d\{6\}\$\/\.test\(token\)\)/);
  assert.match(customer, /request\('\/auth\/v1\/verify'/);
  assert.match(customer, /type:\s*'email'/);
  assert.match(customer, /if \(!payload\?\.access_token \|\| !payload\?\.refresh_token\)/);
});

test('existing password login and registration remain available', () => {
  assert.match(customer, /grant_type=password/);
  assert.match(customer, /auth\/v1\/signup/);
  assert.match(buyer, /Login dengan OTP email/);
  assert.match(buyer, /Login dengan password/);
  assert.match(buyer, /useState<'login' \| 'signup' \| 'reset' \| 'otp'>\('otp'\)/);
  assert.match(buyer, /signupPending/);
  assert.match(customer, /request\('\/auth\/v1\/resend'/);
});

test('OTP email template includes the actual code and matches brand palette', () => {
  assert.match(email, /\{\{\s*\.Token\s*\}\}/);
  assert.match(email, /#c3f85c/);
  assert.doesNotMatch(email, /\{\{\s*\.ConfirmationURL\s*\}\}/);
  assert.match(signupEmail, /\{\{\s*\.Token\s*\}\}/);
  assert.doesNotMatch(signupEmail, /\{\{\s*\.ConfirmationURL\s*\}\}/);
});

test('frontend does not include SMTP credentials', () => {
  assert.doesNotMatch(customer + buyer, /smtp_pass|smtp_password|service_role|sb_secret_/i);
});

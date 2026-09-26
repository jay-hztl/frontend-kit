---
name: form-handling
description: Build forms that validate, report errors accessibly, and survive real use. Use when creating or changing any form, input, search field, filter, login, checkout or settings panel, and when handling validation, submission, or error states. Forms are the most defect-dense UI in most applications.
model: inherit
effort: high
---

# Form handling

More production bugs live in forms than anywhere else in the frontend, because a form
has more states than anything else and most of them are invisible until a real user
hits them.

## Step 1 — Use what the project already has

```bash
grep -oE '"(react-hook-form|formik|final-form|zod|yup|valibot|@hookform/resolvers)"' package.json
```

Also grep for an existing form wrapper — many codebases have `useAppForm`, `<Form>` or a
field component that everything is supposed to go through. **Find it and use it.** A
hand-rolled form next to an established pattern is a review comment.

If nothing is installed, do not add a library unasked. Controlled React state is fine for
a three-field form.

## Step 2 — Decide the validation contract before writing markup

- **When does validation run?** The sane default: validate on blur, re-validate on change
  once a field has errored, and validate everything on submit. Validating on every
  keystroke from the start means the user is told they are wrong while still typing.
- **Where does the truth live?** If the project has Zod/Yup, the schema is the single
  source of truth — infer the TypeScript type from it (`z.infer`) rather than declaring
  the type twice and letting them drift.
- **Client and server.** Client validation is a convenience, never a guarantee. The
  server validates too, and the form must render server-returned field errors — including
  ones the client schema does not know about.

## Step 3 — The state matrix

Every form has all of these. Build them, do not discover them:

| State | What must happen |
|---|---|
| Pristine | No errors shown; submit may be enabled (see below) |
| Focused / dirty | No premature errors |
| Invalid field | Error associated with the field, `aria-invalid`, announced |
| Submitting | Controls disabled, spinner, **double-submit impossible** |
| Server error | Field-level errors mapped back; a form-level error for the rest |
| Network failure | Distinguishable from validation failure; retry possible |
| Success | Confirmation announced, not just a colour change |
| Partial / restored | If the form is long, is progress preserved on navigation? |

**Do not disable submit until the form is valid.** It looks tidy and it is hostile: the
user gets a dead button with no explanation. Let them submit, then show what is wrong and
move focus to the first error.

## Step 4 — Accessibility is most of the work

This is where forms actually fail:

- Every control has a real `<label htmlFor>` tied to its `id`. **A placeholder is not a
  label** — it vanishes on input, usually fails contrast, and is invisible to some AT.
- Errors are associated via `aria-describedby` pointing at the error element's id, and
  the field carries `aria-invalid="true"`.
- The error message is announced — `role="alert"` on the field error, or an
  `aria-live="polite"` summary region.
- On failed submit, move focus to the first invalid field or to an error summary. Do not
  leave focus on the submit button with errors scrolled off-screen.
- Required fields are marked in the accessible name (`aria-required`, or "(required)" in
  the label), never by colour or a bare asterisk alone.
- Related controls are grouped in `<fieldset>` with a `<legend>` — radio groups especially.
- Correct `autocomplete` (`email`, `current-password`, `street-address`…) and `inputmode`
  (`numeric`, `tel`, `email`). These are not polish; they are the difference between a
  form that takes 20 seconds and one that takes two minutes on a phone.

Write error text that says what to do: "Enter a date in the future", not "Invalid input".

## Step 5 — The details that bite

- **Double submit**: disable on submit *and* guard in the handler. Users double-click.
- **`type="button"`** on every non-submit button inside a form, or it submits.
- **Number inputs**: `type="number"` has surprising behaviour (scroll-to-change, locale
  decimal separators). `inputmode="numeric"` with text is often better.
- **Trim on submit**, not on change — trimming as they type stops them typing spaces.
- **Paste**: never block it, especially in password and OTP fields.
- **Long text**: does the error region shift layout when it appears? Reserve the space.
- **Optimistic UI**: only when failure is genuinely rare and reversible, and always with a
  visible rollback path.
- **Unsaved changes**: for long forms, warn on navigation away.

## Step 6 — Test what matters

Behaviour, via the `unit-testing` skill:
- Submitting empty shows the required errors
- An invalid value shows the right message and sets `aria-invalid`
- A valid submit calls the handler once with the right payload
- Double-clicking submit calls it once
- A server error renders against the correct field
- The error is reachable by screen reader (query it `getByRole('alert')`)

Then run `browser-verification` and actually tab through the whole form.

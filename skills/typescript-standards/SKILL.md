---
name: typescript-standards
description: Detect whether the project uses TypeScript and, if so, enforce that every file and every change is properly typed. Use before writing any new file, when adding props or handlers, when tempted to reach for `any`, and when converting JavaScript to TypeScript. Non-optional on any project with a tsconfig.
model: inherit
effort: medium
---

# TypeScript standards

## Step 1 — Detect

```bash
ls tsconfig*.json 2>/dev/null; grep -c '"typescript"' package.json 2>/dev/null
```

- **`tsconfig.json` exists** → every new file is `.ts`/`.tsx`. Not optional, not
  "matching the file I'm editing". If you are creating a file in a TS project, it is a
  TS file.
- **No tsconfig, but `.ts` files exist** → mixed migration. Ask which direction the
  project is going and follow it.
- **No TypeScript at all** → use JSDoc type annotations for exported functions and
  component props. They give editor support without a build change. Mention once that
  TS is available; do not migrate the project unasked.

Read the actual config before writing code:

```bash
grep -E 'strict|noUncheckedIndexedAccess|exactOptionalPropertyTypes|paths|jsx|target' tsconfig.json
```

`strict: false` changes what you can assume. Path aliases change how you import.

## Step 2 — The rules

**No `any`.** Not in props, not in returns, not in catch blocks, not "temporarily".
Where the type is genuinely unknown, use `unknown` and narrow it. Where it is complex,
write the type — that is the work.

**No escape hatches to silence real errors.** `@ts-ignore`, `@ts-expect-error`,
`as unknown as X` and non-null `!` are all admissions that the types describe something
other than reality. If a third-party type is genuinely wrong, add a narrow declaration
with a comment explaining why. Otherwise, fix the type.

**Props are the contract:**
```ts
interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
```
Extending the native element props is what makes a component usable by other people.
Use string-literal unions, not `string`, for anything with a fixed set of values.

**Make impossible states unrepresentable:**
```ts
type Result<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T }
```
Not `{ loading: boolean; error?: Error; data?: T }`, which permits
`loading && error && data` — a state the UI has no rendering for.

**Type events and refs properly:** `React.ChangeEvent<HTMLInputElement>`,
`React.MouseEvent<HTMLButtonElement>`, `useRef<HTMLDivElement>(null)`. Not `any`, not
an inline shape that happens to compile.

**Infer over annotate** for locals. Annotate function parameters, return types of
exported functions, and anything crossing a module boundary.

**`satisfies` when you want both** validation and narrow inference:
```ts
const config = { theme: 'dark', locale: 'en' } satisfies AppConfig
```

**External data is `unknown` until validated.** API responses and `localStorage` values
are not the type you wish they were. If the project has Zod/Valibot/io-ts, parse at the
boundary. If it does not, narrow explicitly and say so — do not cast.

**`const` assertions** for literal objects and arrays used as sources of truth:
`as const`.

**Generics only when they earn it.** A generic with one call site is indirection, not
abstraction.

## Step 3 — Verify

Run it, do not assume it:

```bash
npx tsc --noEmit
```

Check `package.json` for the project's own script first (`typecheck`, `type-check`,
`lint:types`) and prefer that. A change is not done until the type-checker is clean.
Report any pre-existing errors separately from ones you introduced.

## Converting JS to TS

Incrementally, and never in the same commit as a behaviour change:

1. Rename the file to `.ts`/`.tsx`.
2. Fix the errors that appear — actually fix them, do not paper over with `any`.
3. Type the public surface first: exports, props, function signatures.
4. Let inference handle the interior.
5. Type-check, then run the tests.

If a file produces dozens of errors, it likely has a real design problem worth
surfacing rather than a typing problem worth grinding through. Say so.

## Common React typings

| Need | Type |
|---|---|
| Children | `React.ReactNode` |
| A component reference | `React.ComponentType<Props>` |
| Props of an existing component | `React.ComponentProps<typeof Foo>` |
| Native element props, no ref | `React.ComponentPropsWithoutRef<'div'>` |
| Forwarded ref | `React.forwardRef<HTMLDivElement, Props>` |
| A style object | `React.CSSProperties` |
| State setter passed as a prop | `React.Dispatch<React.SetStateAction<T>>` |
| Async server component | `async function Page(): Promise<JSX.Element>` |

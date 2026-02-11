# RADStrat v1 — Liquid Glass Design System

**Updated:** 2026-02-11
**Stack:** Next.js 15 + Tailwind CSS 4 + shadcn/ui + Recharts + lucide-react

---

## Color Palette

### Core Tokens

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--background` | `0 0% 96%` | `#F5F5F5` | Page background |
| `--foreground` | `0 0% 17%` | `#2B2B2B` | Primary text |
| `--card` | `0 0% 100%` | `#FFFFFF` | Card backgrounds |
| `--card-foreground` | `0 0% 17%` | `#2B2B2B` | Card text |
| `--primary` | `166 52% 77%` | `#A5E5D9` | Mint — primary actions, focus rings |
| `--primary-foreground` | `0 0% 17%` | `#2B2B2B` | Text on primary |
| `--secondary` | `27 43% 84%` | `#F5D9BF` | Peach — secondary actions |
| `--secondary-foreground` | `0 0% 17%` | `#2B2B2B` | Text on secondary |
| `--muted` | `0 0% 94%` | `#F0F0F0` | Muted backgrounds |
| `--muted-foreground` | `0 0% 40%` | `#666666` | Secondary/disabled text |
| `--accent` | `262 100% 89%` | `#D9C5F5` | Purple — accent highlights |
| `--accent-foreground` | `0 0% 17%` | `#2B2B2B` | Text on accent |
| `--destructive` | `0 63% 45%` | `#C93434` | Error/delete actions |
| `--destructive-foreground` | `0 0% 100%` | `#FFFFFF` | Text on destructive |
| `--border` | `0 0% 88%` | `#E0E0E0` | Component borders |
| `--input` | `0 0% 88%` | `#E0E0E0` | Input borders |
| `--ring` | `166 52% 77%` | `#A5E5D9` | Focus ring (mint) |

### Chart Palette

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--chart-1` | `166 52% 55%` | `#4DD4C4` | Primary chart (darker mint) |
| `--chart-2` | `262 55% 68%` | `#B89FE6` | Secondary chart (purple) |
| `--chart-3` | `262 100% 80%` | `#D4C5F5` | Tertiary (light purple) |
| `--chart-4` | `330 100% 85%` | `#F0C5E6` | Quaternary (light pink) |
| `--chart-5` | `27 43% 74%` | `#EDDDC9` | Quinary (light peach) |

### Sidebar Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar` | `hsl(0 0% 98%)` | Sidebar background |
| `--sidebar-foreground` | `hsl(0 0% 17%)` | Sidebar text |
| `--sidebar-primary` | `hsl(166 52% 65%)` | Active nav item (mint) |
| `--sidebar-primary-foreground` | `hsl(0 0% 17%)` | Active nav text |
| `--sidebar-accent` | `hsl(262 100% 92%)` | Hover state (purple) |
| `--sidebar-accent-foreground` | `hsl(0 0% 17%)` | Hover text |
| `--sidebar-border` | `hsl(0 0% 90%)` | Sidebar dividers |
| `--sidebar-ring` | `hsl(166 52% 65%)` | Sidebar focus ring |

---

## Typography

**Font:** Inter (Google Fonts, variable `--font-inter`, `subsets: ['latin']`)

| Scale | Tailwind | Usage |
|-------|----------|-------|
| Extra small | `text-xs` | Badges, sidebar labels, footer |
| Small | `text-sm` | Body text, inputs, descriptions (default) |
| Base | `text-base` | Standard prose |
| Large | `text-lg` | Section headers ("Training Analytics") |
| 2XL | `text-2xl` | Page headings (h1) |

**Weights:** `font-medium` (labels, buttons), `font-semibold` (section headers, card titles), `font-bold` (page headings, branding)

**Utilities:** `tracking-widest` (login tagline), `tracking-tight` (page headings), `antialiased` (body)

---

## Glass Card

The signature glassmorphic card used on all stat cards and chart containers.

**CSS class:** `.glass-card`

```css
/* Background */
background: linear-gradient(135deg,
  rgba(255,255,255, 0.82) 0%,
  rgba(255,255,255, 0.60) 50%,
  rgba(255,255,255, 0.72) 100%
);

/* Frosted blur */
backdrop-filter: blur(16px) saturate(1.4);

/* Borders — lighter top/left for light-source illusion */
border:      1px   solid rgba(255,255,255, 0.45);
border-top:  1.5px solid rgba(255,255,255, 0.70);
border-left: 1.5px solid rgba(255,255,255, 0.55);

/* 3-layer shadow + inner highlight */
box-shadow:
  0  4px  8px rgba(0,0,0, 0.08),   /* close */
  0 12px 36px rgba(0,0,0, 0.22),   /* mid */
  0 24px 60px rgba(0,0,0, 0.12),   /* distant */
  inset 0 1px 3px rgba(255,255,255, 0.70);

border-radius: 1.25rem;  /* 20px */
transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Hover state:** shadows deepen, border brightens, `translateY(-2px)` lift.

---

## Spacing & Radius

**Base radius:** `--radius: 1.25rem` (20px)

| Variant | Value | Usage |
|---------|-------|-------|
| `--radius-sm` | 16px | Small buttons, inputs |
| `--radius-md` | 18px | Badges, dropdowns |
| `--radius-lg` | 20px | Cards, dialogs |
| `--radius-xl` | 24px | Large containers |

**Common spacing (Tailwind):**
- `gap-6` — chart grid, main layout sections
- `gap-4` — card content, dashboard sections
- `gap-3` — form elements, login fields
- `gap-2` — button groups, table actions
- `py-6 px-6` — card padding
- `py-4 px-4` — sidebar header/footer

---

## Components (shadcn/ui)

15 components installed in `apps/dashboard/src/components/ui/`:

| Component | File | Usage |
|-----------|------|-------|
| Avatar | `avatar.tsx` | User profile fallback |
| Badge | `badge.tsx` | Role/status labels |
| Button | `button.tsx` | All interactive actions |
| Card | `card.tsx` | Content containers |
| Dialog | `dialog.tsx` | Modal forms (edit, delete, reset) |
| DropdownMenu | `dropdown-menu.tsx` | Row action menus |
| Input | `input.tsx` | Text fields (h-9, rounded-md) |
| Label | `label.tsx` | Form labels |
| Separator | `separator.tsx` | Visual dividers |
| Sheet | `sheet.tsx` | Mobile sidebar |
| Sidebar | `sidebar.tsx` | Navigation sidebar |
| Skeleton | `skeleton.tsx` | Loading placeholders |
| Sonner | `sonner.tsx` | Toast notifications (top-right) |
| Table | `table.tsx` | Data tables |
| Tooltip | `tooltip.tsx` | Hover hints |

---

## Button Variants

| Variant | Style | Usage |
|---------|-------|-------|
| `default` | `bg-primary` (mint) | Primary actions |
| `destructive` | `bg-destructive` (red) | Delete, dangerous actions |
| `outline` | Border + accent hover | Secondary actions |
| `secondary` | `bg-secondary` (peach) | Tertiary actions |
| `ghost` | Transparent + hover accent | Minimal actions |
| `link` | Underline text | Inline links |

**Sizes:** `xs` (h-6), `sm` (h-8), `default` (h-9), `lg` (h-10), `icon` (square), `icon-xs`, `icon-sm`, `icon-lg`

---

## Badge Variants

| Variant | Color | Usage |
|---------|-------|-------|
| `default` | Mint | Super Admin role, Active status |
| `secondary` | Peach | Player role |
| `destructive` | Red | Inactive status |
| `outline` | Border only | Neutral labels |

**Style:** `rounded-full`, `px-2 py-0.5`, `text-xs font-medium`

---

## Icons

**Library:** `lucide-react` v0.468

| Category | Icons |
|----------|-------|
| Navigation | `LayoutDashboard`, `Users`, `Settings` |
| Stats | `UserCheck`, `Activity`, `Database`, `Radio` |
| Actions | `Eye`, `Pencil`, `Trash2`, `KeyRound`, `MoreHorizontal` |
| Table | `Search`, `ArrowUp`, `ArrowDown`, `ArrowUpDown` |
| Misc | `UserPlus`, `TrendingUp`, `TrendingDown` |

**Default size:** `size-4` (16px), `size-3` (12px) for inline indicators

---

## Responsive Breakpoints

| Breakpoint | Width | Stat cards | Chart grid |
|------------|-------|------------|------------|
| Default | <640px | 1 column | 1 column |
| `sm` | 640px | 2 columns | 1 column |
| `md` | 768px | 2 columns | 2 columns |
| `lg` | 1024px | 3 columns | 3 columns |
| `xl` | 1280px | 5 columns | 3 columns |

---

## Charts

**Library:** Recharts 2.x

**Color mapping:** Uses `--chart-1` through `--chart-5` CSS variables.

**Chart types in use:**
- Area chart (daily active users, score trends)
- Radial/donut (completion rate)
- Bar chart (engagement funnel, score comparison, repeat players, improvement distribution)
- Leaderboard list (top improvers — custom component, not Recharts)

---

## Key Patterns

**Page layout:** Sidebar (240px) + main content with `SidebarProvider` wrapper

**Stat card grid:** 5 cards in `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` with `.glass-card`

**Data table:** TanStack Table v8 with `manualPagination`, `manualSorting`, page size selector (10/20/50)

**Forms:** Label + Input pairs in `grid gap-3`, submit button at bottom

**Toasts:** Sonner with `richColors`, positioned `top-right`

**Loading states:** Skeleton placeholders matching content dimensions

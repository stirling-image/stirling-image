# Stirling Image Logo Design Spec

## Concept: The Gem

A faceted diamond/gem mark representing quality ("Sterling") and precision image processing. The facets suggest pixels, image planes, and craftsmanship.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Personality | Professional/Enterprise | Matches the tool's positioning as a serious, self-hostable platform |
| Mark type | Combination mark | Icon + "Stirling Image" wordmark, usable together or separately |
| Icon concept | Faceted gem | Plays on "Sterling" (quality/precious), facets evoke image processing |
| Color | `#3b82f6` (existing primary blue) | Consistent with app UI, single-color for versatility |
| Typography | System font stack, weight 700 | "Stirling" in foreground color, "Image" in primary blue |

## Icon Specification

The gem is a four-point diamond shape (kite) with internal facets creating depth through opacity variation:

- **Outer shape**: Diamond/kite — points at top, bottom, left, right
- **Crown facet** (top center triangle): `#3b82f6` at 100% opacity — the brightest face
- **Left facet**: `#3b82f6` at 70% opacity
- **Right facet**: `#3b82f6` at 50% opacity
- **Upper-left edge facet**: `#3b82f6` at 85% opacity
- **Upper-right edge facet**: `#3b82f6` at 65% opacity
- **Outline**: `#3b82f6` at 100%, 2.5px stroke, round joins
- **Girdle line** (horizontal center): `#3b82f6` at 40% opacity, 1.5px stroke
- **ViewBox**: `0 0 140 140`

### Key coordinates (in 140x140 viewBox)

```
Top:          70, 16
Left:         22, 60
Right:       118, 60
Bottom:       70, 124
Crown-left:   40, 48
Crown-right: 100, 48
Center:       70, 60
```

## Combination Mark Layout

- Icon and wordmark aligned center-vertically
- 16px gap between icon and text (at 28px font size)
- Wordmark: "Stirling " in foreground + "Image" in `#3b82f6`
- Font: system stack, weight 700, letter-spacing -0.5px

## Size Variants

| Context | Size | Notes |
|---------|------|-------|
| Favicon | 16px | Facets merge into solid diamond — drop outline and girdle line |
| App header | 24px | Simplified, no outline stroke |
| Medium (docs, GitHub) | 48px | Full detail with outline and girdle |
| Large (splash, social) | 96px+ | Full detail, all facets visible |

## Color Variants

| Variant | Usage |
|---------|-------|
| Blue on dark (`#0f172a`) | Dark mode, social previews, Docker Hub |
| Blue on white (`#ffffff`) | Light mode, documentation, print |
| Monochrome white | On colored backgrounds, loading screens |
| Monochrome dark (`#0f172a`) | Stamps, watermarks, single-color contexts |

## Files to Generate

| File | Format | Purpose |
|------|--------|---------|
| `logo.svg` | SVG | Full combination mark (icon + wordmark) |
| `logo-icon.svg` | SVG | Icon only, full detail |
| `logo-icon-simple.svg` | SVG | Icon only, simplified for small sizes |
| `favicon.svg` | SVG | Favicon-optimized (no outline/girdle) |
| `favicon.ico` | ICO | Multi-size favicon (16, 32, 48) |
| `logo-192.png` | PNG | PWA icon 192x192 |
| `logo-512.png` | PNG | PWA icon 512x512 |
| `og-image.png` | PNG | Social preview 1200x630 |

## Integration Points

- **App header**: Replace text-only fallback with icon + wordmark (24px icon)
- **Favicon**: Replace default Vite favicon
- **Settings > About**: Show logo
- **Documentation site**: VitePress header
- **Docker Hub**: Repository logo
- **GitHub**: Repository social preview
- **Login/splash screen**: Centered large logo

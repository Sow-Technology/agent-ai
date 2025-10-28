# Comprehensive Light Mode Text Color Analysis

## Issues Found (WHITE/WHITISH IN LIGHT MODE)

### ❌ CRITICAL ISSUES - Using `text-white` directly

These are pure white text that blend into light backgrounds:

1. **Line 313** - "Book a demo" button (secondary) - `text-white`
2. **Line 461** - "The AssureQAI Difference" table title - `text-white`
3. **Line 480, 488, 496, 504** - Table values (₹2, etc.) - `text-white text-lg` / `text-white`
4. **Line 521** - "Everything You Need for Modern QA" heading - `text-white`
5. **Line 539, 554, 575, 593, 613, 628** - Bento card titles - `text-white` (x6)
6. **Line 659, 671, 683** - "How It Works" step titles - `text-white` (x3)
7. **Line 778** - FAQ question text - `text-white`
8. **Line 791** - Final CTA section wrapper - `text-white`

### ⚠️ MEDIUM ISSUES - Using very light grays

These are still light in light mode:

9. **Line 296** - Hero section description - `text-gray-600`
10. **Line 346** - "Trusted by" label - `text-gray-500`
11. **Line 359** - Logo label - `text-gray-500`
12. **Line 378, 447, 453** - Problem & Solution descriptions - `text-gray-600` (x3)
13. **Line 391, 403, 416, 428** - Problem card descriptions - `text-gray-600` (x4)
14. **Line 524** - Feature section description - `text-gray-300` (very light!)
15. **Line 542, 557, 578, 596, 616, 631** - Bento card descriptions - `text-gray-600` (x6)
16. **Line 650** - "How It Works" description - `text-gray-600`
17. **Line 662, 674, 686** - Step descriptions - `text-gray-600` (x3)
18. **Line 704** - Testimonials section description - `text-gray-600`
19. **Line 747** - Testimonial roles - `text-gray-600`
20. **Line 801** - Final CTA description - `text-gray-300` (very light!)
21. **Line 844, 848, 852, 856** - Footer description and links - `text-gray-400/80` (x4+)
22. **Line 865, 896, 929, 960** - Footer section headings - `text-gray-200` (light!)
23. **Line 872, 880, 888, 903, 911, 919, 936, 944, 952, 967** - Footer links - `text-gray-400/80` (x10+)

---

## FIX STRATEGY

### Dark Mode Consideration

These components use `dark:` modifier, so we must maintain that. Pattern:

```
Light: text-gray-800 or text-gray-900
Dark: dark:text-white or dark:text-gray-100
```

### Color Mapping for All Text

| Text Type          | Light Mode      | Dark Mode            | Reason                   |
| ------------------ | --------------- | -------------------- | ------------------------ |
| **Main Headings**  | `text-gray-900` | `dark:text-white`    | High contrast everywhere |
| **Body Text**      | `text-gray-700` | `dark:text-gray-100` | Readable on light BG     |
| **Secondary Text** | `text-gray-600` | `dark:text-gray-300` | Slightly less emphasis   |
| **Tertiary Text**  | `text-gray-600` | `dark:text-gray-400` | Subtle but readable      |
| **Table Values**   | `text-gray-900` | `dark:text-white`    | Important data           |
| **Links**          | `text-gray-700` | `dark:text-gray-400` | Should be distinct       |
| **Footer**         | `text-gray-700` | `dark:text-gray-400` | Readable                 |

---

## SECTIONS TO FIX

1. ✅ **Hero Section** - descriptions
2. ✅ **Companies Section** - "Trusted by" and logo labels
3. ✅ **Problem Section** - descriptions and card content
4. ✅ **Solution Section** - descriptions and table
5. ✅ **Features Section** - heading and descriptions
6. ✅ **How It Works** - descriptions and step titles
7. ✅ **Testimonials** - descriptions and roles
8. ✅ **FAQ** - questions only (answers already fixed)
9. ✅ **Final CTA** - text content
10. ✅ **Footer** - all text

---

## Current Status

**Total problematic elements:** 50+ text color instances
**Files to modify:** 1 (HomePageContent.tsx)
**Complexity:** Medium (systematic replacement needed)

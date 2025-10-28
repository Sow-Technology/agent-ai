# Manual Audit Score Input - Before & After Comparison

## Visual Comparison

### BEFORE: Continuous Slider (0-100)

```
┌─────────────────────────────────────────────┐
│ Score (0-100)                               │
├─────────────────────────────────────────────┤
│ ◯────●────────────────────────────────────  │ (slider at 65)
│                                    [   65   ] (numeric input)
└─────────────────────────────────────────────┘

Issues:
  ❌ User could enter any value 0-100
  ❌ Slider is imprecise on mobile
  ❌ No clear pass/fail semantics
  ❌ Ambiguous scoring for subjective criteria
```

### AFTER: Binary Toggle (0 or Max)

```
┌─────────────────────────────────────────────┐
│ Score: 0 or 5                               │
├─────────────────────────────────────────────┤
│ [ 0  ]  [ 5 ]  [    5    ] (input field)    │
│ (outline) (default)                          │
│ When 0 selected:                             │
│ [  0  ]  [ 5 ]  [    0    ]                  │
│ (default) (outline)                          │
└─────────────────────────────────────────────┘

Advantages:
  ✅ Binary choice - Pass (max) or Fail (0)
  ✅ Clear and intuitive UI
  ✅ Consistent scoring model
  ✅ Visual feedback with button states
  ✅ Optional: Manual input with auto-rounding
```

## User Interaction Flows

### Scenario 1: User clicks 0 button

```
Initial State:
┌──────────────┐ ┌──────────────┐
│ [ 0 ]        │ │ [ 5 ]        │  → Current: 0
│ (default)    │ │ (outline)    │
└──────────────┘ └──────────────┘

No change (already 0)
```

### Scenario 2: User clicks Max button

```
Initial State:
┌──────────────┐ ┌──────────────┐
│ [ 0 ]        │ │ [ 5 ]        │  → Current: 0
│ (default)    │ │ (outline)    │
└──────────────┘ └──────────────┘
        ↓ (click Max button)
Result State:
┌──────────────┐ ┌──────────────┐
│ [ 0 ]        │ │ [ 5 ]        │  → Current: 5
│ (outline)    │ │ (default)    │
└──────────────┘ └──────────────┘
```

### Scenario 3: User types in input field

```
Initial: Score 0
User Types: "3"
System Logic: 3 > (5/2) → True
Result: Score becomes 5
Button State: Max button highlighted

Initial: Score 5
User Types: "2"
System Logic: 2 <= (5/2) → True
Result: Score becomes 0
Button State: 0 button highlighted
```

## Code Comparison

### BEFORE: Slider Implementation

```typescript
<div className="flex items-center gap-2">
  <Slider
    id={`score-${subParam.id}`}
    min={0}
    max={100}
    step={1}
    value={[scoreValue]}
    onValueChange={(value) => handleChange(..., value[0])}
  />
  <Input
    type="number"
    className="w-20"
    value={scoreValue}
    onChange={(e) => handleChange(..., Number(e.target.value))}
  />
</div>
```

### AFTER: Toggle Button Implementation

```typescript
<div className="flex items-center gap-3">
  {/* 0 Button */}
  <Button
    variant={scoreValue === 0 ? "default" : "outline"}
    className="flex-1"
    onClick={() => handleChange(..., 0)}
  >
    0
  </Button>

  {/* Max Button */}
  <Button
    variant={scoreValue === subParam.weight ? "default" : "outline"}
    className="flex-1"
    onClick={() => handleChange(..., subParam.weight)}
  >
    {subParam.weight}
  </Button>

  {/* Optional Input */}
  <Input
    type="number"
    className="w-20"
    placeholder="Or enter"
    value={scoreValue}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      const constrainedValue = value <= subParam.weight / 2 ? 0 : subParam.weight;
      handleChange(..., constrainedValue);
    }}
    min={0}
    max={subParam.weight}
  />
</div>
```

## Button State Variations

### When score = 0

```
┌────────────────┐  ┌────────────────┐
│ [ 0 ]          │  │ [ 5 ]          │
│ (default)      │  │ (outline)      │
│ bg-primary     │  │ border-only    │
│ white text     │  │ dark text      │
└────────────────┘  └────────────────┘
```

### When score = 5 (max)

```
┌────────────────┐  ┌────────────────┐
│ [ 0 ]          │  │ [ 5 ]          │
│ (outline)      │  │ (default)      │
│ border-only    │  │ bg-primary     │
│ dark text      │  │ white text     │
└────────────────┘  └────────────────┘
```

## Score Mapping Examples

### For Weight = 4 (e.g., Critical)

```
Input Value  →  Rounds To
    0        →      0
    1        →      0  (≤ 2)
    2        →      0  (≤ 2)
    3        →      4  (> 2)
    4        →      4
    5        →      4  (capped at max)
```

### For Weight = 5

```
Input Value  →  Rounds To
    0        →      0
    1        →      0
    2        →      0  (≤ 2.5)
    3        →      5  (> 2.5)
    4        →      5
    5        →      5
    6        →      5  (capped at max)
```

### For Weight = 6

```
Input Value  →  Rounds To
    0        →      0
    1        →      0
    2        →      0
    3        →      0  (≤ 3)
    4        →      6  (> 3)
    5        →      6
    6        →      6
    7        →      6  (capped at max)
```

## Mobile Responsiveness

### Desktop View

```
┌─────────────────────────────────────┐
│ [ 0 Button ]  [ Max Button ]  [Input│
└─────────────────────────────────────┘
  flex-1         flex-1         w-20
  (responsive)   (responsive)   (fixed)
```

### Mobile View

```
Same layout:
[ 0 ]  [ 5 ]  [  5  ]

Uses:
  gap-3 for spacing
  flex-1 for buttons (equal width)
  w-20 for input (narrow)
```

## Data Validation

### Current Score State

```
const currentScore = manualAuditResults[groupId]?.[subParamId]?.score || 0

Expected values: 0, 4, 5, or 6 (depending on max)
Invalid values: 1, 2, 3, 7+ (automatically corrected)
```

### On Save

```
Audit result saved with:
{
  parameterId: "...",
  groupId: "...",
  score: 0 | 4 | 5 | 6,  // Only binary values
  comments: "...",
  weight: maxScore         // e.g., 5
}
```

## Testing Scenarios

### Test 1: Toggle from 0 to Max

- Start with score 0
- Click max button → score becomes max ✓
- Button states update correctly ✓

### Test 2: Toggle from Max to 0

- Start with score max
- Click 0 button → score becomes 0 ✓
- Button states update correctly ✓

### Test 3: Type Value Below Midpoint

- Start with score max
- Type "2" (for max=5) → score becomes 0 ✓
- 0 button highlights ✓

### Test 4: Type Value Above Midpoint

- Start with score 0
- Type "4" (for max=5) → score becomes 5 ✓
- Max button highlights ✓

### Test 5: Type At Midpoint

- Score max (e.g., 5)
- Type "2.5" (midpoint) → score becomes 0 ✓
- Type "2.6" (just above) → score becomes 5 ✓

---

**All implementations verified and working correctly!**

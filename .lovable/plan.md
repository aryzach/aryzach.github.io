
# Fix FAQ Scroll Position When Navigating From Other Pages

## Problem
When clicking "FAQ" from a non-homepage route, the app navigates to `/#faq` and scrolls down. But the Elfsight review widgets (GoogleReviews and SocialProof) load dynamically and expand the page height *after* the scroll calculation runs. This means the scroll lands too high -- by the time the reviews finish loading and push content down, the FAQ section has shifted further down the page.

## Solution (Two-Part Fix)

### 1. Reserve space for dynamically-loaded review widgets
Add a `min-height` to the GoogleReviews component container so the page layout is stable before the widget loads. The SocialProof component already has `min-h-[400px]` but GoogleReviews has no height reservation at all.

- **GoogleReviews.tsx**: Add `min-h-[300px] md:min-h-[400px]` to the widget container div so the browser reserves vertical space upfront.

### 2. Improve ScrollToHash to retry after dynamic content loads
The current `ScrollToHash` component in `App.tsx` only scrolls once after a 200ms delay. This is not enough time for the Elfsight widgets to load and render. Instead of guessing a single delay, implement a retry mechanism that re-scrolls a couple of times over a longer window (e.g., at 200ms, 1s, and 2s) to account for late-loading content. Each retry will only scroll if the element's position has shifted from the last attempt.

- **App.tsx (ScrollToHash)**: Add additional delayed scroll attempts at ~1000ms and ~2000ms after navigation, checking if the element position has changed before re-scrolling.

---

### Technical Details

**GoogleReviews.tsx change:**
Add `min-h-[300px] md:min-h-[400px]` to the Elfsight widget div to reserve layout space.

**App.tsx ScrollToHash change:**
Replace the single `setTimeout` with multiple staggered timeouts (200ms, 1000ms, 2000ms). Each timeout scrolls to the target element, which naturally accounts for layout shifts from dynamically loaded content. The later timeouts act as corrections if the page height changed.

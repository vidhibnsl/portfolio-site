# Igloo-Style Portfolio — Full Guide for Newbie Web Designers

This README explains **what was built**, **how each part works**, and **exactly where to edit** text, links, and images. No coding experience required to update content.

---

## What Is This?

This is a **one-page portfolio website** with a minimal, 3D-interactive style inspired by [Igloo.inc](https://www.igloo.inc/). It includes:

- **Header** — Your name (logo) and navigation links
- **Hero** — Big tagline and title that react to your mouse (3D tilt + parallax)
- **Projects** — A list of 12 project cards (image + category + title + description + “View” link)
- **Contact** — A form (First Name, Last Name, Email, Subject, Message) and social links
- **Footer** — Your name and a “Top” link

The site uses **three files** that work together:

| File        | What it does |
|------------|---------------|
| **index.html** | Structure and **all the text/links/images** you see. This is where you change content. |
| **styles.css** | **Looks**: colors, fonts, spacing, layout, animations. Change colors and style here. |
| **script.js**  | **Behavior**: 3D tilt, parallax, smooth scroll, form message, custom cursor. You usually don’t need to edit this. |

There is also an **assets** folder (optional). Right now images are loaded from the internet (Unsplash). You can later put your own images in `assets/` and point the HTML to them.

---

## Folder Structure

```
igloo-style/
├── README.md          ← You are here (this guide)
├── index.html         ← Main page: edit text, links, images here
├── styles.css         ← Edit colors, fonts, spacing here
├── script.js          ← Interactivity (3D, scroll, form) — rarely edit
└── assets/            ← Optional: put your own project images here
```

---

## How Each Part of the Website Works

### 1. **Header (top bar)**

- **What you see:** Your name on the left; “Home”, “Projects”, “Contact” on the right.
- **How it works:** The bar is **fixed** (stays at the top when you scroll). After you scroll down a bit, it gets a slight background so it stays readable (done in **script.js** by adding the class `scrolled`).
- **File:** `index.html` (lines ~16–26).

---

### 2. **Hero (first full-screen section)**

- **What you see:** A WebGL-style 3D placeholder (subtle wireframe shape) in the background, then the label “Real Time 3D Visualizer · World Builder”, then four capabilities: “visualization”, “world building”, “cinematics”, “animations”, a hint “Move cursor to reveal”, and a “Scroll” link.
- **How it works:**
  - **WebGL placeholder:** A minimal Three.js scene draws a soft wireframe torus that slowly rotates and reacts slightly to mouse position. This is in **script.js** (initHeroVisual). The canvas sits in **index.html** inside `.hero-visual`. You can replace this later with your own 3D scene or video.
  - **Capability reveal (aten7-style interaction):** As you move the cursor over the hero, the capability **closest to the cursor** is highlighted (full opacity, scale); the others stay dimmed. So “what I do” is revealed by where you point. This is in **script.js** (mousemove over `[data-capabilities]`).
  - **Content parallax:** The text block shifts slightly with the mouse. The hero background gradient also moves on scroll (parallax).
- **Files:** Structure and text in **index.html** (hero, `.hero-visual`, `.hero-capabilities`, each `.capability`). Look and layout in **styles.css** (hero, hero-visual, capability, .revealed). Behavior in **script.js** (WebGL init + capability reveal).

---

### 3. **Projects section**

- **What you see:** A heading “Select Projects”, then 12 blocks. Each block has:
  - An **image**
  - A **category** (e.g. “Entertainment Production”)
  - A **title** (e.g. “Tommy Hilfiger”)
  - A **short description**
  - A **“View →”** link
- **How it works:**
  - **Scroll reveal:** When you scroll, each project block fades in and moves up slightly when it enters the viewport. This uses **IntersectionObserver** in **script.js** (adds the class `visible`).
  - **3D tilt:** On desktop, when you hover over a project card, the image panel tilts in 3D following your cursor. Done in **script.js** (tilt on `mousemove` / `mouseleave`).
- **Files:** All project text, image URLs, and “View” links are in **index.html**. Layout and card style (borders, shadows, hover) are in **styles.css**.

---

### 4. **Contact section**

- **What you see:** “Contact” heading, a form (First Name, Last Name, Email, Subject, Message, Submit), then “Thanks for submitting.” after submit, and links: Instagram, LinkedIn, YouTube.
- **How it works:**
  - **Form:** Submitting the form is handled in **script.js**: it prevents the real submit, clears the form, and shows “Thanks for submitting.” for a few seconds. It does **not** send data to a server — for that you’d need a backend or a form service (e.g. Formspree, Netlify Forms).
  - **Social links:** Plain links; you set the `href` in **index.html**.
- **Files:** Form structure and social links are in **index.html**. Form styling is in **styles.css**.

---

### 5. **Footer**

- **What you see:** Your name and a “Top” link.
- **How it works:** “Top” links to `#intro`, so clicking it smoothly scrolls back to the hero (smooth scroll is in **script.js**).
- **File:** **index.html** (footer block).

---

### 6. **Custom cursor (desktop only)**

- **What you see:** A small dot and a ring that follow the mouse; the ring grows a bit when hovering links/buttons.
- **How it works:** **script.js** moves the dot with the mouse and animates the ring with a slight delay. On touch devices it’s hidden via CSS.
- **Files:** HTML elements in **index.html** (cursor divs); styles in **styles.css**; behavior in **script.js**. You can hide it by removing or hiding the cursor divs and the cursor code in **script.js**.

---

## Where to Fill In Data and Links

Everything below is edited in **index.html** unless noted.

---

### Browser tab title

- **What:** The text that appears on the browser tab.
- **Where:** `<title>...</title>` inside `<head>` (around line 6).
- **Example:**  
  ` <title>Vidhi Bansal — Real Time 3D Visualizer</title> `

---

### Logo (your name in the header)

- **What:** The clickable name at the top left.
- **Where:** The `<a href="#" class="logo">Vidhi Bansal</a>` (around line 17).
- **To change:** Replace `Vidhi Bansal` with your name. To make it link to another page, change `href="#"` to e.g. `href="https://yoursite.com"`.

---

### Navigation links

- **What:** “Home”, “Projects”, “Contact” in the header.
- **Where:** Inside `<nav class="nav">` (around lines 18–22).
- **To change:**  
  - Change the **text** between the `<a>...</a>` tags.  
  - Change the **destination** by editing the `href`:  
    - `#intro` = scroll to hero  
    - `#projects` = scroll to projects  
    - `#contact` = scroll to contact  
  To link to an external page:  
  ` <a href="https://your-reels-page.com">Reels</a> `

---

### Hero tagline and capability reveal

- **What:** The label “Real Time 3D Visualizer · World Builder”, the four capabilities (visualization, world building, cinematics, animations), and the hint “Move cursor to reveal”.
- **Where:** Inside the hero section: `<p class="hero-label">`, `<div class="hero-capabilities">` with each `<span class="capability" data-capability>`, and `<p class="hero-reveal-hint">`.
- **To change:**  
  - Tagline: edit the text inside `<p class="hero-label">...</p>`.  
  - Capabilities: edit or add/remove `<span class="capability" data-capability>...</span>` items inside `<div class="hero-capabilities" data-capabilities>`. Keep `data-capability` on each span so the reveal logic works.  
  - Hint: edit or remove `<p class="hero-reveal-hint">Move cursor to reveal</p>`.

---

### “Scroll” link

- **What:** The “Scroll” link under the hero title.
- **Where:** `<a href="#projects" class="hero-scroll" ...>Scroll</a>` (around line 41).
- **To change:** Change the text “Scroll” if you want, or change `href="#projects"` to another section id (e.g. `#contact`).

---

### Projects (each project block)

Each project is one `<article class="project-block" ...>...</article>`.

For **each project** you can edit:

| What to change | Where in that article | Example |
|----------------|----------------------|--------|
| **Image**      | Inside `<div class="project-media">`, the `src="..."` of the `<img>` | `src="https://yoursite.com/my-image.jpg"` or `src="assets/my-image.jpg"` |
| **Image alt**  | `alt="..."` on the same `<img>` | `alt="Tommy Hilfiger project"` |
| **Category**   | `<span class="project-cat">...</span>` | e.g. `Entertainment Production` |
| **Title**      | `<h3>...</h3>` | e.g. `Tommy Hilfiger` |
| **Description**| `<p>...</p>` right after the title | Your short project description |
| **“View” link**| `<a href="#" class="project-arrow">View →</a>` | Set `href` to your project page, e.g. `href="https://www.vidhibansal.com/tommyhilfiger"` |

To **add a project:** Copy one full `<article class="project-block" data-project data-tilt">...</article>` block and paste it before the closing `</div>` of the projects inner div. Then change the image, category, title, description, and link.

To **remove a project:** Delete the whole `<article>...</article>` for that project.

---

### Contact form

- **What:** Labels/placeholders and button text.
- **Where:** Inside `<form class="contact-form" id="contactForm">` (around lines 199–208).
- **To change:**  
  - Placeholders: edit the `placeholder="..."` on each `<input>` and `<textarea>`.  
  - Button: edit the text inside `<button type="submit" class="submit-btn">...</button>`.

The form does **not** send emails by itself. To make it send somewhere, you’d need to either:
- Use a form service (e.g. [Formspree](https://formspree.io)) and set the form `action` and `method` in **index.html**, or  
- Add backend code and point the form to your server.  
The “Thanks for submitting.” message is controlled in **script.js** (you can change that text there if you want).

---

### Social links (Instagram, LinkedIn, YouTube)

- **What:** The three links under the contact form.
- **Where:** Inside `<div class="social">` (around lines 211–215).
- **To change:** Replace `href="#"` with your real URLs, and optionally the link text.  
  Example:  
  ` <a href="https://instagram.com/yourhandle">Instagram</a> `  
  ` <a href="https://linkedin.com/in/yourprofile">LinkedIn</a> `  
  ` <a href="https://youtube.com/yourchannel">YouTube</a> `

---

### Footer

- **What:** Your name and “Top” link.
- **Where:** `<footer class="footer">` (around lines 220–223).
- **To change:** Edit the text inside `<span>...</span>` and the `<a href="#intro">Top</a>` (e.g. change “Top” to “Back to top” or change the link).

---

## Quick Reference: What to Edit and in Which File

| What you want to change | File | Where / what to look for |
|--------------------------|------|---------------------------|
| Page title (browser tab) | index.html | `<title>...</title>` in `<head>` |
| Your name (logo + footer) | index.html | `.logo` and `<footer>` |
| Nav links and destinations | index.html | `<nav class="nav">` |
| Hero tagline and capability list / hint | index.html | `.hero-label`, `.hero-capabilities`, `.capability`, `.hero-reveal-hint` |
| Project images | index.html | Each `<article>` → `<img src="...">` |
| Project category, title, description | index.html | Same `<article>` → `.project-cat`, `h3`, `p` |
| Project “View” links | index.html | `<a href="#" class="project-arrow">` in each article |
| Add/remove projects | index.html | Copy or delete full `<article class="project-block" ...>...</article>` |
| Contact form placeholders / button text | index.html | `placeholder="..."`, submit button text |
| Social links (Instagram, etc.) | index.html | `<div class="social">` → each `<a href="...">` |
| Colors (background, text, accents) | styles.css | `:root` at the top: `--bg`, `--fg`, `--fg-dim` |
| Font | styles.css | `:root` → `--font`, and the Google Font link in index.html `<head>` |
| Spacing, section padding | styles.css | `.hero`, `.projects`, `.contact`, etc. |
| “Thanks for submitting.” text | script.js | Search for “Thanks for submitting” and change the string |

---

## Changing Colors (styles.css)

At the very top of **styles.css** you’ll see:

```css
:root {
  --bg: #383e4e;        /* Page background (dark gray) */
  --fg: #b6bac5;       /* Main text (light gray) */
  --fg-dim: rgba(182, 186, 197, 0.7);  /* Muted text */
  --font: 'Syne', sans-serif;
  ...
}
```

- **--bg** — Background color for the page.
- **--fg** — Main text and strong elements.
- **--fg-dim** — Secondary text (nav, categories, descriptions).

Change the hex codes (e.g. `#383e4e`) to any color you like. Keep **--font** as is unless you add a new font in **index.html** and use it here.

---

## Replacing the Hero WebGL Placeholder

The hero uses a **placeholder** 3D scene: a subtle rotating wireframe torus (Three.js) for an Igloo.inc-style WebGL feel. To use your own hero visual:

- **Option A — Keep Three.js:** In **script.js**, find the `initHeroVisual` function. Replace the torus geometry/material with your own Three.js mesh, or load a 3D model. The canvas is already in the DOM (`#heroCanvas`).
- **Option B — Image or video:** Remove or comment out the `initHeroVisual()` call and the Three.js script from **index.html**. Inside `.hero-visual`, replace the canvas with an `<img>` or `<video>` and style it full-bleed (same as the canvas in **styles.css**).
- **Option C — CSS only:** Remove the canvas and use a gradient or animated CSS background in `.hero-visual` in **styles.css**.

The **capability reveal** (cursor highlights the nearest word) works independently of the visual; it only needs the four `.capability` elements and the hero `mousemove` logic in **script.js**.

---

## Using Your Own Images Instead of Unsplash

Right now each project image looks like:

```html
<img src="https://images.unsplash.com/photo-xxxxx?w=800&q=80" alt="Project name" loading="lazy" />
```

To use your own image:

1. Put the image file in the **assets** folder (e.g. `igloo-style/assets/tommy-hilfiger.jpg`).
2. In **index.html**, change that project’s `src` to the file path:

   ```html
   <img src="assets/tommy-hilfiger.jpg" alt="Tommy Hilfiger" loading="lazy" />
   ```

Do the same for every project where you want your own image. Path is relative to **index.html**, so `assets/filename.jpg` is correct.

---

## Running the Site Locally

- **Option 1:** Double-click **index.html** to open it in your browser. Some features (e.g. loading images from the internet) need an internet connection.
- **Option 2:** Run a simple local server from the **igloo-style** folder (or the parent folder), then open the URL it gives you (e.g. `http://localhost:8000/igloo-style/`). This avoids some browser restrictions when opening files directly.

---

## Summary

- **Content and links:** Edit **index.html** (title, logo, nav, hero, every project’s image/title/description/link, contact form labels, social links, footer).
- **Look and feel:** Edit **styles.css** (colors in `:root`, spacing, fonts).
- **Behavior:** Most behavior is in **script.js**; you only need to touch it to change the “Thanks for submitting.” message or to disable/customize the cursor or 3D effects.

If you follow this guide, you can fill in all your data and links without breaking the 3D or layout. If you add or remove project blocks, keep the same structure (one `<article class="project-block" data-project data-tilt">` per project with the same inner classes) so the existing CSS and JS keep working.

---

## Next.js / React Three Fiber Components

A separate set of **TypeScript + React Three Fiber** components lives in `components/` and `utils/`. These implement the same wireframe terrain hero as a drop-in React component for a **Next.js** project.

### Files

| File | Purpose |
|------|---------|
| `utils/terrainNoise.ts` | Noise primitives (`fbm`, `ridgeNoise`), base height map generator. No dependencies. |
| `components/WireframeOverlay.tsx` | HTML overlay — H1 headline + subtitle. Positioned above the 3D canvas. |
| `components/WireframeTerrainHero.tsx` | Main hero component. Renders R3F `<Canvas>`, the terrain mesh, fog/vignette overlays, and the text overlay. |

### Installation (in a Next.js project)

```bash
npm install three @react-three/fiber
npm install -D @types/three
```

### Usage

```tsx
// app/page.tsx (or pages/index.tsx)
import WireframeTerrainHero from '@/components/WireframeTerrainHero';

export default function Home() {
  return (
    <main>
      <WireframeTerrainHero
        headline="Your Name"
        subtitle="3D Visualizer · World Builder · Cinematics"
      />
      {/* rest of your page */}
    </main>
  );
}
```

### How the interaction works

1. **On load** the terrain displays pronounced mountain peaks toward the horizon and a flat grid in the foreground.
2. **Moving the cursor** over the terrain flattens peaks under a smooth gaussian brush into low plateaus.
3. **Fast cursor movement** triggers brief noisy pulses in the nearby topology.
4. **When the cursor moves away** or leaves the viewport, heights smoothly return to the original peaks.
5. **Scrolling** is not required — deformation is continuous and per-frame based.

### Tuning the brush & terrain

Pass a partial `config` prop to override any default:

```tsx
<WireframeTerrainHero
  config={{
    brushFalloff: 12.0,       // lower = wider brush
    flattenStrength: 0.8,     // how much it flattens (0–1)
    plateauFactor: 0.2,       // plateau height as fraction of base
    noiseAmp: 0.45,           // taller peaks
    horizonFalloff: 0.4,      // peaks spread more evenly (vs concentrated at horizon)
    wireColor: '#2a2a3a',     // darker lines
    wireOpacity: 0.5,         // more visible
    pulseAmp: 0.12,           // stronger velocity pulse
  }}
/>
```

### Swapping colors / background

```tsx
<WireframeTerrainHero
  bgColor="#0a0a12"                          // dark background
  config={{ wireColor: '#b6bac5', wireOpacity: 0.3 }}  // light lines
/>
```

### Performance notes

- **Desktop**: 200×120 segments, DPR capped at 2.
- **Mobile** (width < 900): 120×72 segments, DPR capped at 1.5.
- `prefers-reduced-motion`: disables per-frame deformation entirely; terrain shows static peaks.
- Geometry is created once (`useMemo`). Only `position.array` Y values are updated each frame.
- No normals recomputation needed (wireframe `MeshBasicMaterial` doesn't use normals).
# portfolio-site

'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// Every PNG layer shares this exact canvas size.
const CANVAS_W = 2732;
const CANVAS_H = 2048;

// ── EXTERNAL LINK BOOKS ──────────────────────────────────────────
// Books in this map skip the notebook modal entirely and open a new tab.
// Fill in your real URLs here.
const BOOK_LINKS: Record<string, string> = {
  quick_view: 'https://readymag.website/u930497208/6126073/',
  linkedin:   'https://www.linkedin.com/in/lavanya-batra-3a4050316',
};

// ── ILLUSTRATED SPREAD BOOKS ─────────────────────────────────────
// Every book is now a single full-canvas illustrated image — same
// exact width/height as the room itself. No pagination anymore.
//
// NAMING CONVENTION for your exports (drop these in /public/pages/):
//   /pages/{bookId}.PNG
//
// CANVAS: must match your room canvas dimensions exactly (same as
// BASE_LAYERS/BOOK_LAYERS), since it renders full-screen with
// objectFit: cover, same as the room.
//
// CLOSE HOTSPOT: matches your <<< arrows, bottom-left of each tab
// image. Defined in actual canvas pixels (not viewport %), since the
// modal image scales/crops via objectFit:cover just like the room —
// percentages alone drift off-target unless the window matches the
// canvas aspect ratio exactly. Adjust these four numbers if it's off.
const CLOSE_HOTSPOT_PX = { left: 90, top: 1680, width: 420, height: 260 };

// Cat's actual position in canvas pixels (not viewport-center like
// before). Adjust x/y if the wake radius feels off after testing.
const CAT_CENTER_PX = { x: 2460, y: 1700 };
const CAT_WAKE_RADIUS_PX = 260;

// Converted from the old viewport-percentage box (10.58%, 36.23%, 7.58%,
// 9.72%) into canvas pixels, so it stays accurate on every window size
// instead of drifting with cover/contain cropping. May need a small nudge
// after testing — tell me which direction if it's off.
const SWITCHBOARD_HOTSPOT_PX = { left: 289, top: 742, width: 207, height: 199 };

// Cool Sketches background is its own canvas — 1920x1080 — with the
// title and <<< back arrows baked directly into the artwork. Hotspot
// measured directly from the actual image (pixel bounds of the dark
// arrow strokes), same idea as the book modal's back-arrow hotspot.
const SKETCH_BG_W = 1920;
const SKETCH_BG_H = 1080;
const SKETCH_CLOSE_HOTSPOT_PX = { left: 160, top: 820, width: 370, height: 210 };

const BOOKS: Record<string, { title: string; image: string }> = {
  lavanya:         { title: 'Lavanya',              image: '/lavanya_tab.PNG' },
  fun_facts:       { title: 'Fun Facts',             image: '/funfacts_tab.PNG' },
  inspirations:    { title: 'Inspirations',          image: '/inspirations_tab.PNG' },
  erzing:          { title: 'Erzing',                image: '/erzing_tab.PNG' },
  skills:          { title: 'Skills',                image: '/skills_tab.PNG' },
  tet:             { title: 'TET',                   image: '/tet_tab.PNG' },
  lernx:           { title: 'LernX',                 image: '/lernx_tab.PNG' },
  founder_diaries: { title: "Founder's Diaries",     image: '/founderdiaries_tab.PNG' },
  inside_lvmh:     { title: 'Inside LVMH',           image: '/insidelvmh_tab.PNG' },
  neuromarketing:  { title: 'Neuromarketing',        image: '/neuromarketing_tab.PNG' },
  nykaa:           { title: 'Nykaa',                 image: '/nykaa_tab.PNG' },
  consumerism:     { title: 'Consumerism & Faith',   image: '/consumerism_tab.PNG' },
  ai:              { title: 'AI in Marketing',       image: '/aimarketing_tab.PNG' },
  automotives:     { title: 'Automotives',           image: '/automotives_tab.PNG' },
  loreal:          { title: "L'Oreal",               image: '/loreal_tab.PNG' },
  brand_genz:      { title: 'Brand & GenZ',          image: '/brand&genz_tab.PNG' },
};

const GALLERY_POSITIONS = [
  { x: 28, y: 40, rot: -12 }, { x: 36, y: 45, rot: 8 }, { x: 44, y: 39, rot: -6 }, { x: 52, y: 45, rot: 13 },
  { x: 32, y: 62, rot: 9 },   { x: 40, y: 68, rot: -14 }, { x: 48, y: 61, rot: 6 }, { x: 56, y: 68, rot: -9 },
];

// EXACT filenames as saved - with spaces matching your actual files
const BASE_LAYERS = [
  '/wall.PNG',
  '/floor.PNG',
  '/mat.PNG',
  '/desk.PNG',
  '/curtain rod.PNG',
  '/couch.PNG',
  '/canvas.PNG',
  '/flower vase.PNG',
  '/flowers.PNG',
  '/picture frame 4.PNG',
  '/name picture frame.PNG',
  '/picture frame 3.PNG',
  '/self picture frame.PNG',
  '/picture frame 2.PNG',
  '/picture frame 1.PNG',
  '/parissky.PNG',
  '/window.PNG',
  '/switchboard.PNG',
  '/curtains.PNG',
  '/shelf vase.PNG',
  '/magazines.PNG',
  '/lamps.PNG',
];

// NOTE: 'hobbies.PNG' removed from the shelf.
// 'quick view.PNG' replaces it in the same slot — export the new
// spine artwork at full canvas size, transparent bg, same as every
// other book layer below.
const BOOK_LAYERS: { src: string; bookId: string }[] = [
  { src: '/lavanya.PNG',                      bookId: 'lavanya'         },
  { src: '/quickview.PNG',                    bookId: 'quick_view'      },
  { src: '/fun facts.PNG',                    bookId: 'fun_facts'       },
  { src: '/inspirations.PNG',                 bookId: 'inspirations'    },
  { src: '/erzing.PNG',                       bookId: 'erzing'          },
  { src: '/linkedin.PNG',                     bookId: 'linkedin'        },
  { src: '/skills.PNG',                       bookId: 'skills'          },
  { src: '/tet.PNG',                          bookId: 'tet'             },
  { src: '/lernx.PNG',                        bookId: 'lernx'           },
  { src: "/founder's diaries-unprompted.PNG", bookId: 'founder_diaries' },
  { src: '/inside lvmh.PNG',                  bookId: 'inside_lvmh'     },
  { src: '/neuromarketing.PNG',               bookId: 'neuromarketing'  },
  { src: '/nykaa.PNG',                        bookId: 'nykaa'           },
  { src: '/consumerism and faith.PNG',        bookId: 'consumerism'     },
  { src: '/ai in marketing.PNG',              bookId: 'ai'              },
  { src: '/automotives.PNG',                  bookId: 'automotives'     },
  { src: "/l'oreal.PNG",                      bookId: 'loreal'          },
  { src: '/brand & genz.PNG',                 bookId: 'brand_genz'      },
];

// Included alongside BOOK_LAYERS for pixel-perfect hit-testing, but
// handled separately on click (opens the sketch gallery, not a book).
const SKETCH_LAYER = { src: '/cool sketch paper and pencil.PNG', bookId: '__sketches__' };
const CLICKABLE_LAYERS = [...BOOK_LAYERS, SKETCH_LAYER];

// FALLBACK RECTANGULAR HITBOXES — used automatically when the browser
// can't read real transparency data (a known Safari/WebKit quirk with
// canvas reading certain PNGs — Chrome and others aren't affected).
// These are first-pass estimates in canvas pixels (2732x2048) — test each
// book and tell me which direction (left/right/up/down) and roughly how
// much to nudge any that miss, same process as the arrows/switchboard.
const BOOK_HITBOXES: Record<string, { left: number; top: number; width: number; height: number }> = {
  lavanya:         { left: 593,  top: 1232, width: 80,  height: 200 },
  quick_view:      { left: 656,  top: 1221, width: 90,  height: 200 },
  fun_facts:       { left: 771,  top: 1338, width: 220, height: 80 },
  inspirations:    { left: 756,  top: 1388, width: 240, height: 85 },
  erzing:          { left: 1054, top: 1208, width: 90,  height: 210 },
  linkedin:        { left: 1124, top: 1361, width: 260, height: 95 },
  skills:          { left: 1379, top: 1200, width: 110, height: 230 },
  tet:             { left: 1489, top: 1214, width: 80,  height: 220 },
  lernx:           { left: 1555, top: 1211, width: 80,  height: 220 },
  founder_diaries: { left: 682,  top: 1534, width: 240, height: 70 },
  inside_lvmh:     { left: 688,  top: 1588, width: 240, height: 70 },
  neuromarketing:  { left: 623,  top: 1638, width: 260, height: 75 },
  nykaa:           { left: 675,  top: 1671, width: 260, height: 85 },
  consumerism:     { left: 1055, top: 1527, width: 100, height: 230 },
  ai:              { left: 1123, top: 1530, width: 100, height: 230 },
  automotives:     { left: 1188, top: 1678, width: 280, height: 80 },
  loreal:          { left: 1455, top: 1533, width: 110, height: 230 },
  brand_genz:      { left: 1552, top: 1511, width: 90,  height: 230 },
  __sketches__:    { left: 680,  top: 1780, width: 260, height: 160 },
};

const usingFallbackHitboxes = (canvasW: number, canvasH: number, x: number, y: number, bookId: string) => {
  const h = BOOK_HITBOXES[bookId];
  if (!h) return false;
  return x >= h.left && x <= h.left + h.width && y >= h.top && y <= h.top + h.height;
};

export default function Portfolio() {
  const [lightsOn, setLightsOn]           = useState(false);
  const [openBookId, setOpenBookId]       = useState<string | null>(null);
  const [catAwake, setCatAwake]           = useState(false);
  const [tailFrame, setTailFrame]         = useState(0);
  const [sketchOpen, setSketchOpen]       = useState(false);
  const [hoveredSketch, setHoveredSketch] = useState<number | null>(null);
  const [hoveredBook, setHoveredBook]     = useState<string | null>(null);
  const catRef  = useRef<HTMLDivElement>(null);
  const sleepTm = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<HTMLDivElement>(null);

  const [switchboardStyle, setSwitchboardStyle] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const computeSwitchboardStyle = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Inverse of screenToCanvas's contain math: convert the switchboard's
      // fixed canvas-pixel hotspot back into real on-screen pixels for
      // whatever the current window size/letterboxing happens to be.
      const scale = Math.min(vw / CANVAS_W, vh / CANVAS_H);
      const offX = (vw - CANVAS_W * scale) / 2;
      const offY = (vh - CANVAS_H * scale) / 2;
      const h = SWITCHBOARD_HOTSPOT_PX;
      setSwitchboardStyle({
        left: offX + h.left * scale,
        top: offY + h.top * scale,
        width: h.width * scale,
        height: h.height * scale,
      });
    };
    computeSwitchboardStyle();
    window.addEventListener('resize', computeSwitchboardStyle);
    return () => window.removeEventListener('resize', computeSwitchboardStyle);
  }, []);

  // ── PIXEL-PERFECT BOOK HIT-DETECTION ──────────────────────────
  // Every book PNG shares the same 2732x2048 canvas. Instead of guessing
  // percentage boxes (which breaks on tightly-packed/overlapping spines),
  // we load each book's actual alpha channel once, then on click/hover
  // check the real transparency at the exact pixel the cursor is over.
  //
  // IMPORTANT PERFORMANCE NOTE: this reuses the <img> elements that
  // next/image already rendered on the shelf (matched via their alt
  // attribute, which we set to bookId) rather than creating a second
  // `new Image()` and re-fetching every file from scratch. The earlier
  // version re-downloaded all 18 full-size book PNGs a second time
  // just to read their transparency — this was a real, sizeable chunk
  // of your load time and is now eliminated entirely.
  const alphaMaps = useRef<Record<string, Uint8ClampedArray>>({});
  const [mapsReady, setMapsReady] = useState(false);
  const [useFallbackHitboxes, setUseFallbackHitboxes] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    // Resolves to null (instead of hanging forever) if a given book's image
    // never loads within 4s — e.g. a filename mismatch or missing file.
    // This means ONE broken image only disables that one book, instead of
    // silently freezing clicks/hover for every book on the shelf.
    const waitForRenderedImg = (bookId: string): Promise<HTMLImageElement | null> =>
      new Promise((resolve) => {
        let done = false;
        const finish = (result: HTMLImageElement | null) => {
          if (!done) { done = true; resolve(result); }
        };
        const timeoutId = setTimeout(() => {
          console.warn(`[hit-detection] "${bookId}" image never loaded — check its filename/casing in /public. This book will not be clickable until fixed.`);
          finish(null);
        }, 4000);
        const tryFind = () => {
          if (done) return;
          const el = document.querySelector<HTMLImageElement>(`img[alt="${bookId}"]`);
          if (el && el.complete && el.naturalWidth > 0) { clearTimeout(timeoutId); finish(el); }
          else requestAnimationFrame(tryFind);
        };
        tryFind();
      });

    (async () => {
      const resolvedEls = await Promise.all(
        CLICKABLE_LAYERS.map((b) => waitForRenderedImg(b.bookId))
      );
      if (cancelled) return;

      let totalNonZero = 0;
      CLICKABLE_LAYERS.forEach((b, idx) => {
        const el = resolvedEls[idx];
        if (!el) return; // skip this one book; everything else still works
        try {
          ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
          ctx.drawImage(el, 0, 0, CANVAS_W, CANVAS_H);
          const data = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
          const alpha = new Uint8ClampedArray(CANVAS_W * CANVAS_H);
          let nonZero = 0;
          for (let i = 0; i < CANVAS_W * CANVAS_H; i++) {
            alpha[i] = data[i * 4 + 3];
            if (alpha[i] > 0) nonZero++;
          }
          totalNonZero += nonZero;
          alphaMaps.current[b.bookId] = alpha;
        } catch {
          // Drawing/reading this one image failed — it'll just fall through
          // to the rectangular fallback check below if needed.
        }
      });

      // If basically nothing came back non-transparent across ALL 19
      // images, the browser's canvas can't read real pixel data here
      // (the Safari/WebKit quirk) — switch to rectangular fallback boxes
      // instead of relying on (broken) pixel-perfect detection.
      if (!cancelled && totalNonZero < 5000) setUseFallbackHitboxes(true);

      if (!cancelled) setMapsReady(true);
    })();

    return () => { cancelled = true; };
  }, []);

  // Maps any screen point to a given canvas's pixel space, accounting
  // for object-fit:CONTAIN scaling + centered letterboxing (NOT cover —
  // contain never crops, so on any window size the full canvas is always
  // visible, just with empty space added on whichever side doesn't match
  // the window's aspect ratio). Shared by the room, book modal, and
  // sketch gallery — each passes its own canvas dimensions.
  const screenToCanvas = (clientX: number, clientY: number, rect: DOMRect, canvasW = CANVAS_W, canvasH = CANVAS_H) => {
    const scale = Math.min(rect.width / canvasW, rect.height / canvasH);
    const dispW = canvasW * scale;
    const dispH = canvasH * scale;
    const offX = (rect.width - dispW) / 2;
    const offY = (rect.height - dispH) / 2;
    return {
      x: (clientX - rect.left - offX) / scale,
      y: (clientY - rect.top - offY) / scale,
    };
  };

  const getBookAtPoint = (clientX: number, clientY: number): string | null => {
    if (!roomRef.current) return null;
    const rect = roomRef.current.getBoundingClientRect();
    const { x, y } = screenToCanvas(clientX, clientY, rect);
    const imgX = Math.round(x);
    const imgY = Math.round(y);

    if (useFallbackHitboxes) {
      // Rectangular fallback — checked in reverse so books declared later
      // (visually on top in overlapping spots) win ties, same rule as
      // the pixel-perfect path.
      for (let i = CLICKABLE_LAYERS.length - 1; i >= 0; i--) {
        const bookId = CLICKABLE_LAYERS[i].bookId;
        if (usingFallbackHitboxes(CANVAS_W, CANVAS_H, imgX, imgY, bookId)) return bookId;
      }
      return null;
    }
    if (imgX < 0 || imgX >= CANVAS_W || imgY < 0 || imgY >= CANVAS_H) return null;
    const idx = imgY * CANVAS_W + imgX;
    for (let i = CLICKABLE_LAYERS.length - 1; i >= 0; i--) {
      const b = CLICKABLE_LAYERS[i];
      const alpha = alphaMaps.current[b.bookId];
      if (alpha && alpha[idx] > 20) return b.bookId;
    }
    return null;
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!roomRef.current) return;
      const rect = roomRef.current.getBoundingClientRect();
      const { x, y } = screenToCanvas(e.clientX, e.clientY, rect);
      const dist = Math.hypot(x - CAT_CENTER_PX.x, y - CAT_CENTER_PX.y);
      if (dist < CAT_WAKE_RADIUS_PX) {
        setCatAwake(true);
        if (sleepTm.current) { clearTimeout(sleepTm.current); sleepTm.current = null; }
      } else if (!sleepTm.current) {
        sleepTm.current = setTimeout(() => { setCatAwake(false); sleepTm.current = null; }, 2000);
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTailFrame(f => f === 0 ? 1 : 0), 950);
    return () => clearInterval(t);
  }, []);

  // Books that just open an external link, in a new tab.
  const handleBookClick = (bookId: string) => {
    const link = BOOK_LINKS[bookId];
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
      return;
    }
    setOpenBookId(bookId);
  };

  const book = openBookId ? BOOKS[openBookId] : null;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#1a1208' }}>

      {/* DARK VERSION always underneath */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image unoptimized src="/lights off version.PNG" alt="dark" fill priority style={{ objectFit: 'contain' }} />
      </div>

      {/* LIT VERSION fades in on top */}
      <div ref={roomRef} style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: lightsOn ? 1 : 0, transition: 'opacity 1.6s ease', pointerEvents: lightsOn ? 'auto' : 'none' }}>

        {/* Base room layers */}
        {BASE_LAYERS.map((src, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0 }}>
            <Image unoptimized src={src} alt={src} fill style={{ objectFit: 'contain', pointerEvents: 'none' }} />
          </div>
        ))}

        {/* BOOKS — purely visual now. Clicking/hovering is handled by
            the single pixel-perfect overlay below, not per-div zones,
            so overlapping/tightly-packed spines no longer steal clicks
            from each other. */}
        {BOOK_LAYERS.map((b, i) => (
          <div key={i}
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              transform: hoveredBook === b.bookId ? 'translateY(-6px) scale(1.05)' : 'none',
              transition: 'transform 0.2s ease',
              filter: hoveredBook === b.bookId ? 'brightness(1.15)' : 'none',
            }}>
            <Image unoptimized src={b.src} alt={b.bookId} fill style={{ objectFit: 'contain', pointerEvents: 'none' }} />
          </div>
        ))}

        {/* TAIL ANIMATION */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Image unoptimized src="/tail_1.PNG" alt="tail" fill style={{ objectFit: 'contain', opacity: tailFrame === 0 ? 1 : 0, transition: 'opacity 0.9s ease', pointerEvents: 'none' }} />
          <Image unoptimized src="/tail_2.PNG" alt="tail" fill style={{ objectFit: 'contain', opacity: tailFrame === 1 ? 1 : 0, transition: 'opacity 0.9s ease', pointerEvents: 'none' }} />
        </div>

        {/* CAT BODY */}
        <div ref={catRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Image unoptimized src="/cat sleeping.PNG" alt="cat" fill style={{ objectFit: 'contain', pointerEvents: 'none' }} />
        </div>

        {/* CAT EYES */}
        <div style={{ position: 'absolute', inset: 0, opacity: catAwake ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: 'none' }}>
          <Image unoptimized src="/cat_eyes.PNG" alt="cat eyes" fill style={{ objectFit: 'contain', pointerEvents: 'none' }} />
        </div>

        {/* COOL SKETCHES — same hover pop-up treatment as the books,
            driven by the same hoveredBook state (SKETCH_LAYER.bookId) */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          transform: hoveredBook === SKETCH_LAYER.bookId ? 'translateY(-6px) scale(1.05)' : 'none',
          transition: 'transform 0.2s ease',
          filter: hoveredBook === SKETCH_LAYER.bookId ? 'brightness(1.15)' : 'none',
        }}>
          <Image unoptimized src="/cool sketch paper and pencil.PNG" alt={SKETCH_LAYER.bookId} fill style={{ objectFit: 'contain', pointerEvents: 'none' }} />
        </div>

        {/* SINGLE HIT-TEST OVERLAY — the only clickable surface for
            books + sketches. Uses pixel-perfect transparency detection
            where the browser supports it, and falls back to calibrated
            rectangular hitboxes automatically otherwise (see
            useFallbackHitboxes / getBookAtPoint). */}
        <div
          style={{ position: 'absolute', inset: 0, cursor: hoveredBook ? 'pointer' : 'default', zIndex: 40 }}
          onMouseMove={(e) => {
            if (!mapsReady) return;
            setHoveredBook(getBookAtPoint(e.clientX, e.clientY));
          }}
          onMouseLeave={() => setHoveredBook(null)}
          onClick={(e) => {
            if (!mapsReady) return;
            const hit = getBookAtPoint(e.clientX, e.clientY);
            if (!hit) return;
            if (hit === SKETCH_LAYER.bookId) { setSketchOpen(true); return; }
            handleBookClick(hit);
          }}
        />

      </div>

      {/* SWITCHBOARD — sized to its actual hotspot only (not full-screen),
          so it can't block clicks/hover anywhere else on the page. Stays
          independent of the lit-room wrapper so it still works with
          lights off. Position recalculated on resize via switchboardStyle. */}
      {switchboardStyle && (
        <div
          onClick={() => setLightsOn((l) => !l)}
          style={{
            position: 'fixed',
            left: switchboardStyle.left,
            top: switchboardStyle.top,
            width: switchboardStyle.width,
            height: switchboardStyle.height,
            cursor: 'pointer',
            zIndex: 50,
          }}
        />
      )}

      {/* BOOK SPREAD — full-screen takeover, exact canvas match, same
          idea as the room itself. Closing happens via the <<< arrows
          you've drawn bottom-left on the artwork, not a coded button. */}
      {openBookId && book && (
        <div ref={modalRef}
          onClick={(e) => {
            if (!modalRef.current) return;
            const rect = modalRef.current.getBoundingClientRect();
            const { x, y } = screenToCanvas(e.clientX, e.clientY, rect);
            const h = CLOSE_HOTSPOT_PX;
            if (x >= h.left && x <= h.left + h.width && y >= h.top && y <= h.top + h.height) {
              setOpenBookId(null);
            }
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#1a1208', cursor: 'pointer' }}>
          <Image unoptimized src={book.image} alt={book.title} fill priority style={{ objectFit: 'contain', pointerEvents: 'none' }} />
        </div>
      )}

      {/* SKETCH GALLERY — title, tagline, and <<< back arrows are now
          baked into the background art itself. Closing works the same
          way as the book modals: check the real click point against
          the arrows' actual pixel position (measured directly from
          the image), not a coded button. */}
      {sketchOpen && (
        <div ref={sketchRef}
          onClick={(e) => {
            if (!sketchRef.current) return;
            const rect = sketchRef.current.getBoundingClientRect();
            const { x, y } = screenToCanvas(e.clientX, e.clientY, rect, SKETCH_BG_W, SKETCH_BG_H);
            const h = SKETCH_CLOSE_HOTSPOT_PX;
            if (x >= h.left && x <= h.left + h.width && y >= h.top && y <= h.top + h.height) {
              setSketchOpen(false);
            }
          }}
          style={{ position: 'fixed', inset: 0, background: '#1a140a', zIndex: 1000, overflow: 'hidden' }}>
          <Image unoptimized src="/coolsketch_bg.PNG" alt="background" fill priority style={{ objectFit: 'contain', pointerEvents: 'none' }} />
          {GALLERY_POSITIONS.map((pos, i) => (
            <div key={i} onMouseEnter={() => setHoveredSketch(i)} onMouseLeave={() => setHoveredSketch(null)}
              style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, width: '140px', height: '196px', border: '1px solid #d4c8a8',
                transform: hoveredSketch === i ? 'rotate(0deg) scale(1.18)' : `rotate(${pos.rot}deg)`,
                zIndex: hoveredSketch === i ? 200 : 5 + i,
                boxShadow: hoveredSketch === i ? '8px 8px 30px rgba(0,0,0,0.75)' : '3px 3px 10px rgba(0,0,0,0.5)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'pointer',
                overflow: 'hidden' }}>
              <Image unoptimized src={`/sketch_${i + 1}.png`} alt={`Sketch ${i + 1}`} fill style={{ objectFit: 'contain', pointerEvents: 'none' }} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
      `}</style>
    </div>
  );
}

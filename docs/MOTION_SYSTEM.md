# Motion system

The cinematic entrance uses one normalized progress value from native scrolling across a bounded sticky canvas. A paused Anime.js timeline is sought directly; it owns the typography, SVG progress path and numeric scene signal. Three.js subscribes to the signal, computes deterministic poses, updates camera look-at orientation and lighting, then renders on demand. Publishing the signal happens after the timeline seek, preventing a one-event lag between text and geometry.

Motion owns global navigation, page entry, filtered lists, form progression, validation feedback, dialogs and toast feedback. It never owns the sculpture or cinematic text. The homepage is mounted only on `/`; productivity routes do not load the Three.js scene.

Motion tokens: 160 ms small feedback and 240 ms page entry. The publishing form uses 160 ms directional steps. Story transforms track scroll without delayed autoplay or inertia. Native scrolling remains available, and entry links plus a Skip the story action avoid forcing the full sequence.

Reduced-motion users receive one static resolved sculpture, semantic introductory copy and direct entry links. Simple view is also available manually. WebGL creation failure renders an original SVG. Mobile uses 18 pieces versus 24 on desktop, a 512 versus 1024 shadow map, a separate framing treatment and capped pixel ratio. Resize changes update the rendering tier. Intersection visibility, RAF cancellation and resource/listener cleanup prevent unnecessary work.

The storyboard and reference observations are documented in `SCROLL_STORYBOARD.md` and `REDESIGN_AUDIT.md`.

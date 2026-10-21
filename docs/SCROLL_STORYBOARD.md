# The Common Form — scroll storyboard

Original asset: three bands of individually chamfered mineral segments. The unassembled problem is a layered vessel on a low plinth. The resolved form is three intersecting bands: different contributions creating one shared structure. No external model or texture assets.

| Scroll  | Scene                | Sculpture and camera                                                                       | Typography                          |
| ------- | -------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------- |
| 0–14%   | The unsolved problem | Grounded stacked bands; oblique view and a shallow approach                                | Some problems are worth solving.    |
| 14–34%  | Deconstruction       | Individual segments lift, separate and rotate around their own centers; camera arcs upward | Look at it differently.             |
| 34–51%  | Possibilities        | Coordinated exploded assembly; forward camera movement through the negative space          | Different minds. New possibilities. |
| 51–72%  | Connection           | Segments move into three complementary planes; camera passes the aperture                  | Find the people. Build the answer.  |
| 72–88%  | Resolution           | Pieces seat into an interlocking sculpture; camera widens to reveal the whole              | Better things are built together.   |
| 88–100% | Enter                | Final composition holds; direct entry links remain available                               | Explore problems / Post a problem   |

One sticky canvas, one normalized progress value, native scrolling, roughly 3.4 viewport heights of travel. Anime.js seeks a paused timeline from raw scroll progress. Three.js applies deterministic poses and renders on demand. Motion owns navigation, route and application interactions. No engine competes for the same property.

Reduced motion: one static resolved composition with readable semantic introduction and direct entry. Unsupported WebGL: original inline SVG sculpture. Mobile: fewer segments, smaller shadow map and capped pixel ratio. Cleanup cancels RAF, releases geometry/materials/textures, and disconnects scroll/resize/intersection/theme listeners. Reverse scrolling deterministically retraces the same poses.

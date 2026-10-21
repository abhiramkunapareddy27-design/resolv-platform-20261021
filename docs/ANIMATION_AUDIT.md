# Animation implementation audit

| Library  | Implemented feature                                                                 | Actual source                                                |
| -------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Anime.js | Scroll-linked typography choreography across six scene states                       | `src/components/cinematic-home.tsx`                          |
| Anime.js | Paused cinematic timeline sought from normalized native scrolling                   | `src/components/cinematic-home.tsx`                          |
| Anime.js | SVG journey progress path drawing                                                   | `src/components/cinematic-home.tsx`                          |
| Motion   | Active navigation indicator, mobile navigation expansion and page entry             | `src/components/platform-app.tsx`                            |
| Motion   | Layout-aware search/filter listing transitions                                      | `src/components/explore.tsx`                                 |
| Motion   | Team and talent discovery interactions                                              | `src/components/teams.tsx`, `src/components/talent.tsx`      |
| Motion   | Multi-step publishing form and validation feedback                                  | `src/components/problem-editor.tsx`, `src/components/ui.tsx` |
| Motion   | Accessible dialog entry/exit, toast feedback and form buttons                       | `src/components/ui.tsx`, `src/components/platform-app.tsx`   |
| Three.js | Original beveled segmented sculpture, procedural materials and physical environment | `src/components/sculpture.tsx`                               |
| Three.js | Scroll-driven object poses, camera position/orientation and light intensity         | `src/components/sculpture.tsx`, `src/lib/cinematic.ts`       |

The previous wireframe network and long marketing homepage were removed during the redesign. Their features are not claimed as part of the new implementation.

The numeric choreography is deterministic. Unit tests verify distinct opening/exploded/resolved states, reverse equality, finite positions at 1,001 progress samples, mobile geometry reduction and static reduced-motion poses. Browser inspection confirmed forward and reverse scene changes, readable opening/resolution copy, direct navigation and the Simple view alternative. No continuous render loop runs while idle.

Source guidance reviewed: [Anime.js timelines](https://animejs.com/documentation/timeline/), [timeline seeking](https://animejs.com/documentation/timeline/timeline-methods/seek/), [Motion React animation](https://motion.dev/docs/react-animation), [Motion accessibility](https://motion.dev/docs/react-accessibility), [Three.js documentation](https://threejs.org/docs/).

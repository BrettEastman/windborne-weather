

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CPNZdNdy.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/B8C68kId.js","_app/immutable/chunks/CGfr7eec.js"];
export const stylesheets = ["_app/immutable/assets/0.hjNgRN2o.css"];
export const fonts = [];

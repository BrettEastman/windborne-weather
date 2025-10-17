export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["halfBlue.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.C8LiKRo0.js",app:"_app/immutable/entry/app.22c6itFu.js",imports:["_app/immutable/entry/start.C8LiKRo0.js","_app/immutable/chunks/CFrA7X7Y.js","_app/immutable/chunks/CBWahqQq.js","_app/immutable/chunks/CGfr7eec.js","_app/immutable/entry/app.22c6itFu.js","_app/immutable/chunks/CGfr7eec.js","_app/immutable/chunks/CBWahqQq.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/BZrhSzSA.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/api/balloons",
				pattern: /^\/api\/balloons\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/balloons/_server.ts.js'))
			},
			{
				id: "/api/satellites",
				pattern: /^\/api\/satellites\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/satellites/_server.ts.js'))
			}
		],
		prerendered_routes: new Set(["/"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

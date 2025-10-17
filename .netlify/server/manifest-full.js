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
		client: {start:"_app/immutable/entry/start.2MC8Y71a.js",app:"_app/immutable/entry/app.BsPYpc8H.js",imports:["_app/immutable/entry/start.2MC8Y71a.js","_app/immutable/chunks/DzqRysmy.js","_app/immutable/chunks/CBWahqQq.js","_app/immutable/chunks/CGfr7eec.js","_app/immutable/entry/app.BsPYpc8H.js","_app/immutable/chunks/CGfr7eec.js","_app/immutable/chunks/CBWahqQq.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/BZrhSzSA.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/balloons",
				pattern: /^\/api\/balloons\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/balloons/_server.ts.js'))
			},
			{
				id: "/api/satellites",
				pattern: /^\/api\/satellites\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/satellites/_server.ts.js'))
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/frontend/lib/store.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Shared in-memory store for MVP demo
// In production, this would be replaced with database calls
__turbopack_context__.s([
    "store",
    ()=>store
]);
class Store {
    static instance;
    callEvents = [];
    blocklist = new Set();
    MAX_EVENTS = 100;
    constructor(){
        // Seed with demo data
        this.callEvents.push({
            callId: "demo-1",
            caller: "+15551234567",
            verdict: "SCAM",
            status: "completed",
            transcript: "Hello, I am calling from the IRS. You owe back taxes and will be arrested if you do not pay immediately with gift cards.",
            analysis: {
                label: "SCAM",
                confidence: 0.95,
                reasons: [
                    "Claimed to be IRS",
                    "Demanded immediate payment",
                    "Asked for gift cards"
                ]
            },
            timestamp: new Date().toISOString(),
            blocked: false
        });
    }
    static getInstance() {
        if (!Store.instance) {
            Store.instance = new Store();
        }
        return Store.instance;
    }
    // Call Events
    addEvent(event) {
        const fullEvent = {
            ...event,
            blocked: this.blocklist.has(event.caller)
        };
        this.callEvents.unshift(fullEvent);
        if (this.callEvents.length > this.MAX_EVENTS) {
            this.callEvents.pop();
        }
        return fullEvent;
    }
    getEvents(limit = 50) {
        return this.callEvents.slice(0, limit).map((e)=>({
                ...e,
                blocked: this.blocklist.has(e.caller)
            }));
    }
    // Blocklist
    blockNumber(number) {
        this.blocklist.add(number);
    }
    unblockNumber(number) {
        this.blocklist.delete(number);
    }
    isBlocked(number) {
        return this.blocklist.has(number);
    }
    getBlocklist() {
        return Array.from(this.blocklist);
    }
}
const store = Store.getInstance();
}),
"[project]/frontend/app/api/blocklist/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/store.ts [app-route] (ecmascript)");
;
;
async function GET() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true,
        numbers: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["store"].getBlocklist()
    });
}
async function POST(req) {
    try {
        const { number } = await req.json();
        if (!number) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: "number required"
            }, {
                status: 400
            });
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["store"].blockNumber(number);
        console.log(`[Blocklist] Added: ${number}`);
        return __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            number,
            action: "blocked"
        });
    } catch (err) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: err.message
        }, {
            status: 500
        });
    }
}
async function DELETE(req) {
    try {
        const { number } = await req.json();
        if (!number) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: "number required"
            }, {
                status: 400
            });
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["store"].unblockNumber(number);
        console.log(`[Blocklist] Removed: ${number}`);
        return __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            number,
            action: "unblocked"
        });
    } catch (err) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: err.message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e79d88c0._.js.map
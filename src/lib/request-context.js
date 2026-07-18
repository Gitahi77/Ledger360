"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestId = exports.getRequestContext = void 0;
const headers_1 = require("next/headers");
const uuid_1 = require("uuid");
const react_1 = require("react");
/**
 * Lazily retrieves or generates the context for the current request.
 * Uses React's `cache` to ensure the same object is returned
 * consistently throughout a single server request lifecycle.
 */
exports.getRequestContext = (0, react_1.cache)(async () => {
    let id = '';
    try {
        const headersList = await (0, headers_1.headers)();
        const existingId = headersList.get('x-request-id');
        if (existingId) {
            id = existingId;
        }
    }
    catch (error) {
        // headers() throws if called outside of a request context
    }
    if (!id) {
        id = `REQ-${(0, uuid_1.v4)().substring(0, 8).toUpperCase()}`;
    }
    return {
        id,
        queryCount: 0,
        queries: [],
        metrics: {
            validationTimeMs: 0,
            authorizationTimeMs: 0,
            businessLogicTimeMs: 0,
            prismaTimeMs: 0,
            serializationTimeMs: 0
        }
    };
});
/**
 * Helper to get just the ID for backwards compatibility
 */
const getRequestId = async () => {
    const ctx = await (0, exports.getRequestContext)();
    return ctx.id;
};
exports.getRequestId = getRequestId;

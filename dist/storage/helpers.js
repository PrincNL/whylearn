"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNoDuplicateIds = exports.checksumState = exports.cloneDatasetState = exports.createRecordId = void 0;
const crypto_1 = require("crypto");
const createRecordId = (_prefix) => (0, crypto_1.randomUUID)();
exports.createRecordId = createRecordId;
const cloneDatasetState = (state) => JSON.parse(JSON.stringify(state));
exports.cloneDatasetState = cloneDatasetState;
const checksumState = (state) => (0, crypto_1.createHash)('sha256').update(JSON.stringify(state.records)).digest('hex');
exports.checksumState = checksumState;
const assertNoDuplicateIds = (dataset, records) => {
    const seen = new Set();
    for (const record of records) {
        const id = record?.id;
        if (!id) {
            throw new Error(`Dataset ${dataset} contains a record without an id`);
        }
        if (seen.has(id)) {
            throw new Error(`Dataset ${dataset} contains duplicate id ${id}`);
        }
        seen.add(id);
    }
};
exports.assertNoDuplicateIds = assertNoDuplicateIds;
//# sourceMappingURL=helpers.js.map
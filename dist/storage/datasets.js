"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datasetList = exports.datasetDefinitions = void 0;
const ISO_EPOCH = new Date(0).toISOString();
const empty = (schemaVersion) => ({
    schemaVersion,
    records: [],
    lastUpdatedAt: ISO_EPOCH,
});
exports.datasetDefinitions = {
    users: {
        name: 'users',
        schemaVersion: 1,
        primaryKey: (record) => record.id,
        emptyState: empty(1),
    },
    learningPlans: {
        name: 'learningPlans',
        schemaVersion: 1,
        primaryKey: (record) => record.id,
        emptyState: empty(1),
    },
    progress: {
        name: 'progress',
        schemaVersion: 1,
        primaryKey: (record) => record.id,
        emptyState: empty(1),
    },
    gamification: {
        name: 'gamification',
        schemaVersion: 1,
        primaryKey: (record) => record.id,
        emptyState: empty(1),
    },
    coaching: {
        name: 'coaching',
        schemaVersion: 1,
        primaryKey: (record) => record.id,
        emptyState: empty(1),
    },
    subscriptions: {
        name: 'subscriptions',
        schemaVersion: 1,
        primaryKey: (record) => record.id,
        emptyState: empty(1),
    },
    subscriptionTiers: {
        name: 'subscriptionTiers',
        schemaVersion: 1,
        primaryKey: (record) => record.id,
        emptyState: empty(1),
    },
    subscriptionEntitlements: {
        name: 'subscriptionEntitlements',
        schemaVersion: 1,
        primaryKey: (record) => record.id,
        emptyState: empty(1),
    },
};
exports.datasetList = Object.keys(exports.datasetDefinitions);
//# sourceMappingURL=datasets.js.map
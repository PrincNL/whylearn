"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDataCommand = exports.runMigrate = exports.runImport = exports.runExport = exports.runValidate = exports.runBackup = void 0;
const path_1 = __importDefault(require("path"));
const datasets_1 = require("../../storage/datasets");
const storage_1 = require("../../storage");
const migrations_1 = require("../../storage/migrations");
const buildDefaultExportPath = () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path_1.default.resolve(process.cwd(), '.data', 'exports', `whylearn-export-${stamp}.json`);
};
const collectDatasetSteps = (dataset) => migrations_1.migrationPlan.filter((step) => step.dataset === dataset).sort((a, b) => a.from - b.from);
const runBackup = async (options = {}) => {
    const driver = await (0, storage_1.initStorage)();
    const backupPath = await driver.createBackup(options.label);
    return { backupPath };
};
exports.runBackup = runBackup;
const runValidate = async () => {
    const driver = await (0, storage_1.initStorage)();
    const report = await driver.validate();
    if (report.hasErrors) {
        const messages = report.issues
            .filter((issue) => issue.level === 'error')
            .map((issue) => `${issue.dataset}: ${issue.message}`);
        const detail = [`Validation failed with ${messages.length} error(s):`, ...messages].join('\n');
        throw new Error(detail);
    }
    return { report };
};
exports.runValidate = runValidate;
const runExport = async (options = {}) => {
    const driver = await (0, storage_1.initStorage)();
    const target = options.target ? path_1.default.resolve(options.target) : buildDefaultExportPath();
    const file = await driver.exportTo(target);
    return { file };
};
exports.runExport = runExport;
const runImport = async (options) => {
    if (!options.source) {
        throw new Error('Import requires a source file path');
    }
    const driver = await (0, storage_1.initStorage)();
    const importOptions = options.correlationId ? { correlationId: options.correlationId } : undefined;
    await driver.importFrom(path_1.default.resolve(options.source), importOptions);
    const report = await driver.validate();
    if (report.hasErrors) {
        throw new Error('Import completed but validation failed');
    }
    return { report };
};
exports.runImport = runImport;
const runMigrate = async () => {
    const driver = await (0, storage_1.initStorage)();
    const backup = await driver.createBackup('pre-migration');
    const summaries = [];
    for (const datasetName of datasets_1.datasetList) {
        const definition = datasets_1.datasetDefinitions[datasetName];
        const state = await driver.readDataset(definition);
        let currentVersion = state.schemaVersion ?? 0;
        const targetVersion = definition.schemaVersion;
        const steps = collectDatasetSteps(datasetName);
        const appliedSteps = [];
        let changed = false;
        for (const step of steps) {
            if (currentVersion !== step.from || step.to > targetVersion) {
                continue;
            }
            await driver.transaction(definition, (existing) => step.migrate(existing), {
                description: step.description,
                correlationId: `migrate-${datasetName}-${step.to}`,
                actor: 'migration-cli',
            });
            currentVersion = step.to;
            appliedSteps.push(step.description);
            changed = true;
        }
        if (currentVersion !== targetVersion) {
            const result = await driver.transaction(definition, (existing) => ({
                ...existing,
                schemaVersion: targetVersion,
            }), {
                description: 'schema version sync',
                correlationId: `schema-sync-${datasetName}`,
                actor: 'migration-cli',
            });
            currentVersion = result.state.schemaVersion;
            changed = changed || !!appliedSteps.length || currentVersion !== state.schemaVersion;
        }
        summaries.push({
            dataset: datasetName,
            beforeVersion: state.schemaVersion ?? 0,
            afterVersion: currentVersion,
            stepsApplied: appliedSteps,
            changed,
        });
    }
    const validation = await driver.validate();
    if (validation.hasErrors) {
        throw new Error('Post-migration validation failed');
    }
    return { backupPath: backup, summaries, validation };
};
exports.runMigrate = runMigrate;
const runDataCommand = async (argv) => {
    const [, , command, ...rest] = argv;
    switch (command) {
        case 'backup':
            await (0, exports.runBackup)();
            return;
        case 'validate':
            await (0, exports.runValidate)();
            return;
        case 'export': {
            const targetArg = rest[0];
            await (0, exports.runExport)(targetArg ? { target: targetArg } : {});
            return;
        }
        case 'import': {
            const sourceArg = rest[0];
            if (!sourceArg) {
                throw new Error('Import requires a source file path');
            }
            await (0, exports.runImport)({ source: sourceArg });
            return;
        }
        case 'migrate':
            await (0, exports.runMigrate)();
            return;
        default:
            throw new Error(`Unknown data command: ${command}`);
    }
};
exports.runDataCommand = runDataCommand;
//# sourceMappingURL=commands.js.map
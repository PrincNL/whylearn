"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteDriver = void 0;
class SqliteDriver {
    options;
    constructor(options = {}) {
        this.options = options;
        void options;
    }
    async init() {
        throw new Error("SqliteDriver is a placeholder and is not implemented yet.");
    }
    async getMetadata() {
        throw new Error("SqliteDriver is a placeholder and is not implemented yet.");
    }
    async readDataset(dataset) {
        throw new Error(`SqliteDriver is a placeholder and cannot read dataset ${dataset.name}.`);
    }
    async readAll() {
        throw new Error("SqliteDriver is a placeholder and cannot read datasets.");
    }
    async transaction(dataset, _mutator, _options) {
        throw new Error(`SqliteDriver is a placeholder and cannot mutate dataset ${dataset.name}.`);
    }
    async createBackup(_label) {
        throw new Error("SqliteDriver does not support backups yet.");
    }
    async ensureDailyBackup() {
        return null;
    }
    async exportTo(_targetFile) {
        throw new Error("SqliteDriver does not support export yet.");
    }
    async importFrom(_sourceFile, _options) {
        throw new Error("SqliteDriver does not support import yet.");
    }
    async validate() {
        throw new Error("SqliteDriver validation is not implemented yet.");
    }
}
exports.SqliteDriver = SqliteDriver;
//# sourceMappingURL=SqliteDriver.js.map
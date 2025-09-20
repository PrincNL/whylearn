"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteDriver = exports.JsonFileDriver = exports.initStorage = exports.setStorageAdapter = exports.getStorageAdapter = void 0;
const env_1 = require("../config/env");
const JsonFileDriver_1 = require("./json/JsonFileDriver");
let adapter = null;
const getStorageAdapter = () => {
    if (!adapter) {
        adapter = new JsonFileDriver_1.JsonFileDriver({ baseDir: env_1.env.DATA_DIR });
    }
    return adapter;
};
exports.getStorageAdapter = getStorageAdapter;
const setStorageAdapter = (custom) => {
    adapter = custom;
};
exports.setStorageAdapter = setStorageAdapter;
const initStorage = async () => {
    const driver = (0, exports.getStorageAdapter)();
    await driver.init();
    return driver;
};
exports.initStorage = initStorage;
__exportStar(require("./types"), exports);
__exportStar(require("./StorageAdapter"), exports);
var JsonFileDriver_2 = require("./json/JsonFileDriver");
Object.defineProperty(exports, "JsonFileDriver", { enumerable: true, get: function () { return JsonFileDriver_2.JsonFileDriver; } });
var SqliteDriver_1 = require("./sqlite/SqliteDriver");
Object.defineProperty(exports, "SqliteDriver", { enumerable: true, get: function () { return SqliteDriver_1.SqliteDriver; } });
//# sourceMappingURL=index.js.map
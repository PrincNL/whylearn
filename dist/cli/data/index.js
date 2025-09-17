#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const commands_1 = require("./commands");
(0, commands_1.runDataCommand)(process.argv).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
//# sourceMappingURL=index.js.map
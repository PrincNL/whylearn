#!/usr/bin/env node
/* eslint-disable no-console */
import { runDataCommand } from './commands';

runDataCommand(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

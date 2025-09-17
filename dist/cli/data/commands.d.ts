import type { DatasetName } from '../../storage/types';
import type { ValidationReport } from '../../storage/StorageAdapter';
export interface BackupOptions {
    label?: string;
}
export interface BackupResult {
    backupPath: string;
}
export interface ValidateResult {
    report: ValidationReport;
}
export interface ExportOptions {
    target?: string;
}
export interface ExportResult {
    file: string;
}
export interface ImportOptions {
    source: string;
    correlationId?: string;
}
export interface MigrationSummary {
    dataset: DatasetName;
    beforeVersion: number;
    afterVersion: number;
    stepsApplied: string[];
    changed: boolean;
}
export interface MigrateResult {
    backupPath: string;
    summaries: MigrationSummary[];
    validation: ValidationReport;
}
export declare const runBackup: (options?: BackupOptions) => Promise<BackupResult>;
export declare const runValidate: () => Promise<ValidateResult>;
export declare const runExport: (options?: ExportOptions) => Promise<ExportResult>;
export declare const runImport: (options: ImportOptions) => Promise<ValidateResult>;
export declare const runMigrate: () => Promise<MigrateResult>;
export declare const runDataCommand: (argv: string[]) => Promise<void>;
//# sourceMappingURL=commands.d.ts.map
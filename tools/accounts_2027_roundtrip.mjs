// Experimental local COPY writer. Never uploads or replaces a business workbook.
// Preservation must be audited independently before any copy could be accepted.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { SpreadsheetFile } from '@oai/artifact-tool';

async function main() {
const [inputPath, requestPath, outputDir] = process.argv.slice(2);
if (!inputPath || !requestPath || !outputDir) throw new Error('Expected input.xlsx request.json NEW_OUTPUT_DIR');
const plannerPath = process.env.FE_ACCOUNTS_PLANNER;
if (!plannerPath) throw new Error('FE_ACCOUNTS_PLANNER must name the checked-in Python planner');
const proposal = JSON.parse(execFileSync(process.env.FE_ACCOUNTS_PYTHON || 'python3',
  [plannerPath, inputPath, '--request', requestPath], { encoding: 'utf8', maxBuffer: 100000 }));
if (proposal.mode !== 'dry_run' || proposal.writable !== false || proposal.status !== 'pending_review') {
  throw new Error('Expected a fictitious pending proposal');
}
const raw = await fs.readFile(inputPath);
const sourceSha256 = crypto.createHash('sha256').update(raw).digest('hex');
if (sourceSha256 !== proposal.workbook_sha256) throw new Error('WORKBOOK_CHANGED');
// A new directory is mandatory; no overwrite, same-path save or symlink reuse.
await fs.mkdir(outputDir);
// importXlsx accepts ArrayBuffer/FileBlob, not a Node Buffer view. Import
// exactly the bytes whose digest was checked, without reopening the input.
const workbook = await SpreadsheetFile.importXlsx(
  raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
const sheet = workbook.worksheets.getItem(proposal.sheet);
if (sheet.name !== proposal.sheet) {
  throw new Error('IMPORT_SHEET_NAME_CHANGED');
}
const row = proposal.candidate_row;
const saveRender = async (filename) => {
  const image = await workbook.render({sheetIndex: sheet.index,
    range: `A${row - 2}:Q${row + 2}`, scale: 1, format: 'png'});
  await fs.writeFile(path.join(outputDir, filename), new Uint8Array(await image.arrayBuffer()), {flag: 'wx'});
};
await saveRender('before.png');
// Only proposal columns C:H. Existing destination formatting is retained.
const cells = proposal.proposed_cells;
// Keep the source's number format. Excel's 1900 date system is enforced by
// the planner; export a date serial rather than changing the cell to t="d".
const excelDate = (Date.parse(`${cells.D}T00:00:00Z`) - Date.UTC(1899, 11, 30)) / 86400000;
sheet.getRange(`C${row}:H${row}`).values = [[cells.C, excelDate,
  cells.E, cells.F, cells.G, cells.H.amount_cents / 100]];
workbook.recalculate();
await saveRender('after.png');
const copy = await SpreadsheetFile.exportXlsx(workbook);
await copy.save(path.join(outputDir, 'unverified.candidate.xlsx'));
// Export is not success. Always run the independently implemented audit and
// retain its result privately; a rejected copy exits nonzero and is never applied.
const candidatePath = path.join(outputDir, 'unverified.candidate.xlsx');
const preservedPath = path.join(outputDir, 'preserved.candidate.xlsx');
const packaging = spawnSync(process.env.FE_ACCOUNTS_PYTHON || 'python3',
  [path.join(path.dirname(plannerPath), 'accounts_2027_package.py'), inputPath, candidatePath, requestPath, preservedPath,
    '--expected-proposal-id', proposal.proposal_id],
  {encoding:'utf8',maxBuffer:100000});
let packaged;
try { packaged = JSON.parse(packaging.stdout); }
catch { throw new Error('PACKAGE_PRESERVATION_UNAVAILABLE'); }
if (packaging.status !== 0 || packaged.status !== 'isolated_copy_preserved' || packaged.production_writable !== false ||
    packaged.proposal_id !== proposal.proposal_id) {
  throw new Error(packaged.reason || 'PACKAGE_PRESERVATION_REJECTED');
}
const auditProcess = spawnSync(process.env.FE_ACCOUNTS_PYTHON || 'python3',
  [path.join(path.dirname(plannerPath), 'accounts_2027_verify.py'), inputPath, preservedPath, requestPath],
  {encoding:'utf8',maxBuffer:100000});
let audit;
try { audit = JSON.parse(auditProcess.stdout); }
catch { throw new Error('COPY_AUDIT_UNAVAILABLE'); }
const verified = auditProcess.status === 0 && audit.status === 'copy_preservation_checks_passed'
  && audit.production_writable === false && audit.source_sha256 === sourceSha256 && audit.proposal_id === proposal.proposal_id;
await fs.writeFile(path.join(outputDir, 'audit.json'), JSON.stringify(audit, null, 2), {flag:'wx'});
await fs.writeFile(path.join(outputDir, 'trial.json'), JSON.stringify({
  mode: 'isolated_copy_trial', production_writable: false, preservation_verified: verified,
  source_sha256: sourceSha256, proposal_id: proposal.proposal_id,
  sheet: proposal.sheet, allowed_value_cells: ['C', 'D', 'E', 'F', 'G', 'H'].map(c => c + row)
}, null, 2), {flag: 'wx'});
console.log(JSON.stringify({status: verified ? 'copy_audited_requires_review' : 'copy_rejected_by_audit',
  production_writable: false, preservation_verified: verified}));
if (!verified) process.exitCode = 2;
}
main().catch(error => {
  console.error(JSON.stringify({status: 'blocked', production_writable: false,
    reason: String(error.message).slice(0, 200)}));
  process.exitCode = 2;
});

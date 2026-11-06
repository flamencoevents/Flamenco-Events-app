// Experimental local COPY writer. Never uploads or replaces a business workbook.
// Preservation must be audited independently before any copy could be accepted.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
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
const workbook = await SpreadsheetFile.importXlsx(raw);
const sheet = workbook.worksheets.getItemAt(0);
if (sheet.name !== proposal.sheet) {
  throw new Error('IMPORT_SHEET_NAME_CHANGED');
}
const row = proposal.candidate_row;
const saveRender = async (filename) => {
  const image = await workbook.render({sheetName: proposal.sheet,
    range: `A${row - 2}:Q${row + 2}`, scale: 1, format: 'png'});
  await fs.writeFile(path.join(outputDir, filename), new Uint8Array(await image.arrayBuffer()), {flag: 'wx'});
};
await saveRender('before.png');
// Only proposal columns C:H. Existing destination formatting is retained.
const cells = proposal.proposed_cells;
sheet.getRange(`C${row}:H${row}`).values = [[cells.C, new Date(`${cells.D}T00:00:00Z`),
  cells.E, cells.F, cells.G, cells.H.amount_cents / 100]];
workbook.recalculate();
await saveRender('after.png');
const copy = await SpreadsheetFile.exportXlsx(workbook);
await copy.save(path.join(outputDir, 'unverified.candidate.xlsx'));
// No assertion that export preserved features: independent XML audit is required.
await fs.writeFile(path.join(outputDir, 'trial.json'), JSON.stringify({
  mode: 'isolated_copy_trial', production_writable: false, preservation_verified: false,
  source_sha256: sourceSha256, proposal_id: proposal.proposal_id,
  sheet: proposal.sheet, allowed_value_cells: ['C', 'D', 'E', 'F', 'G', 'H'].map(c => c + row)
}, null, 2), {flag: 'wx'});
console.log(JSON.stringify({status: 'candidate_exported_requires_audit', production_writable: false}));
}
main().catch(error => {
  console.error(JSON.stringify({status: 'blocked', production_writable: false,
    reason: String(error.message).slice(0, 200)}));
  process.exitCode = 2;
});

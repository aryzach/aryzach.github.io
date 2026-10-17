import { readFile, writeFile } from 'node:fs/promises';
import { importRentalSnapshot } from '../src/lib/importRentalSnapshot.ts';
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Pass the private snapshot path and private output path.');
const workspace = importRentalSnapshot(JSON.parse(await readFile(input, 'utf8')));
await writeFile(output, JSON.stringify(workspace), { mode: 0o600 });
console.log(JSON.stringify({ customers: workspace.customers.length, saunas: workspace.assets.length, linkedRentalDrafts: workspace.rentals.length, existingLinks: workspace.legacyLinks.length, confirmedInstallations: workspace.assignments.length, exportedAt: workspace.source.exportedAt }));

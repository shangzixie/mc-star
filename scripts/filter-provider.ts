import * as fs from 'fs';
import * as path from 'path';

interface Provider {
  type: number;
  companyId: number;
  name: string;
  code: string;
}

interface RawProvider {
  type?: number;
  companyId?: number;
  name?: string;
  code?: string;
  [key: string]: unknown;
}

async function filterProviderData(): Promise<void> {
  try {
    // Read the original provider.json file
    const inputPath = path.join(__dirname, 'provider.json');
    const outputPath = path.join(__dirname, 'provider-filtered.json');

    console.log('Reading provider data...');
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const providers: RawProvider[] = JSON.parse(rawData);

    console.log(`Total records: ${providers.length}`);

    // Filter to keep only required fields
    const filteredProviders: Provider[] = providers.map((provider) => ({
      type: provider.type || 0,
      companyId: provider.companyId || 0,
      name: provider.name || '',
      code: provider.code || '',
    }));

    // Write to new file
    console.log('Writing filtered data...');
    fs.writeFileSync(outputPath, JSON.stringify(filteredProviders, null, 2));

    console.log(`✅ Success! Filtered data saved to: ${outputPath}`);
    console.log(`Records processed: ${filteredProviders.length}`);

    // Show sample
    console.log('\nSample of filtered data:');
    console.log(JSON.stringify(filteredProviders.slice(0, 3), null, 2));
  } catch (error) {
    console.error('Error processing provider data:', error);
    process.exit(1);
  }
}

filterProviderData();

// scripts/purge-auth-users.mjs
// Apaga usuários do Firebase Auth (com --dry-run, --anonymous-only, --yes)

import fs from 'node:fs';
import path from 'node:path';

// --- Corrige conflito do undici/fetch no WebContainer/StackBlitz ---
try {
  delete globalThis.fetch;
  delete globalThis.Headers;
  delete globalThis.Request;
  delete globalThis.Response;
} catch (_) { /* ok */ }

// Carrega o firebase-admin SÓ depois de remover o fetch global
const { default: admin } = await import('firebase-admin');

const credPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve('secrets/service-account.json');

if (!fs.existsSync(credPath)) {
  console.error('Erro: credencial não encontrada em:', credPath);
  console.error('Defina GOOGLE_APPLICATION_CREDENTIALS ou crie secrets/service-account.json');
  process.exit(1);
}

// Valida JSON de credencial
let serviceAccount;
try {
  const raw = fs.readFileSync(credPath, 'utf8');
  serviceAccount = JSON.parse(raw);
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Arquivo não parece ser uma chave de Service Account válida.');
  }
} catch (e) {
  console.error('Falha ao ler/parsear credencial:', e.message);
  process.exit(1);
}

// Inicializa Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id, // ajuda alguns ambientes
  });
} catch (e) {
  console.error('Falha ao inicializar firebase-admin:', e);
  process.exit(1);
}

const anonymousOnly = process.argv.includes('--anonymous-only');
const dryRun       = process.argv.includes('--dry-run');
const yes          = process.argv.includes('--yes');

async function run() {
  let nextPageToken;
  const toDelete = [];

  do {
    const res = await admin.auth().listUsers(1000, nextPageToken);
    for (const u of res.users) {
      // "Anônimo" = sem providerData (usuário criado via signInAnonymously)
      const isAnon = !u.providerData || u.providerData.length === 0;
      if (!anonymousOnly || isAnon) {
        toDelete.push({
          uid: u.uid,
          email: u.email || '(sem email)',
          anon: isAnon,
        });
      }
    }
    nextPageToken = res.pageToken;
  } while (nextPageToken);

  console.log(
    `Encontrados ${toDelete.length} usuário(s) ${anonymousOnly ? '(apenas anônimos)' : ''}.`
  );

  if (dryRun) {
    console.table(toDelete.slice(0, 50));
    console.log('Dry-run: nada foi apagado.');
    return;
  }

  if (!yes) {
    console.log('Use --yes para confirmar a exclusão, ou --dry-run para simular.');
    return;
  }

  // Deleta em lotes (máx. 1000 por chamada)
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 1000) {
    const batch = toDelete.slice(i, i + 1000).map(u => u.uid);
    const res = await admin.auth().deleteUsers(batch);
    deleted += res.successCount;
    console.log(`Apagados: ${deleted}/${toDelete.length} (falhas: ${res.failureCount})`);
  }
  console.log('Concluído.');
}

run().catch(err => {
  console.error('Erro geral:', err);
  process.exit(1);
});

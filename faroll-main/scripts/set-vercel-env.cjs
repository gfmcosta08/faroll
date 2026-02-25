// Adiciona variáveis ao Vercel production SEM newline (evita "Invalid Key")
const { execSync } = require('child_process');

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bmR5eXBreXJsa3RrYWR5bXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzY1OTAsImV4cCI6MjA4NTU1MjU5MH0.5BYPNbD3cXA-_f_SMzKk4fUCGHOgGON13E13un9zox8';
const vars = [
  ['VITE_SUPABASE_URL', 'https://btndyypkyrlktkadymuv.supabase.co'],
  ['VITE_SUPABASE_PUBLISHABLE_KEY', anonKey],
  ['VITE_SUPABASE_ANON_KEY', anonKey],
  ['VITE_SUPABASE_PROJECT_ID', 'btndyypkyrlktkadymuv'],
];

for (const [name, value] of vars) {
  try {
    execSync(`npx vercel env add ${name} production`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit'],
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    console.log('OK:', name);
  } catch (e) {
    console.error('Erro:', name, e.message);
    process.exit(1);
  }
}

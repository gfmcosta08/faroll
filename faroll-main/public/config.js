// Configuração de runtime — sobrescreve variáveis de build-time do Vite
// A anon key do Supabase é segura para commitar (pública por design, protegida por RLS)
// Este arquivo é carregado pelo browser ANTES do bundle React, garantindo que
// as keys corretas sejam usadas independente de como o build foi feito (Lovable.dev, CI/CD, etc.)
window.__FAROLL_CONFIG__ = {
  supabaseUrl: 'https://btndyypkyrlktkadymuv.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bmR5eXBreXJsa3RrYWR5bXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzY1OTAsImV4cCI6MjA4NTU1MjU5MH0.5BYPNbD3cXA-_f_SMzKk4fUCGHOgGON13E13un9zox8'
};

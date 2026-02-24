
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = 'd:/farollbr/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^"|"$/g, '');
    }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('SUPABASE_URL or SUPABASE_KEY is missing');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUser() {
    const email = 'gfmcosta@gmail.com';

    console.log(`Checking user: ${email}`);

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, nome, email')
        .eq('email', email)
        .maybeSingle();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
    }

    if (!profile) {
        console.log('Profile not found for this email.');
        return;
    }

    console.log('Profile found:', JSON.stringify(profile, null, 2));

    const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.user_id);

    if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return;
    }

    console.log('Roles found:', roles?.map(r => r.role) || []);
}

checkUser();

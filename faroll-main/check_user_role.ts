
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from d:\farollbr\.env
dotenv.config({ path: 'd:/farollbr/.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('SUPABASE_URL or SUPABASE_KEY is missing');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUser() {
    const email = 'gfmcosta@gmail.com';

    console.log(`Checking user: ${email}`);

    // 1. Get user by email from auth.users (requires service role, but we can check profiles first)
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

    console.log('Profile found:', profile);

    // 2. Check roles
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

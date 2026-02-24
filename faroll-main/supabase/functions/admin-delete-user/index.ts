import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to validate caller
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate caller's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerId = claimsData.claims.sub;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if caller is admin
    const { data: callerRoles, error: callerRolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);

    if (callerRolesError || !callerRoles?.some(r => r.role === 'admin')) {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem excluir usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { user_id: targetUserId } = await req.json();

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'ID do usuário não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (targetUserId === callerId) {
      return new Response(
        JSON.stringify({ error: 'Você não pode excluir sua própria conta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if target is admin (cannot delete admins)
    const { data: targetRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId);

    if (targetRoles?.some(r => r.role === 'admin')) {
      return new Response(
        JSON.stringify({ error: 'Não é permitido excluir contas de administradores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target's profile_id
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, nome, email')
      .eq('user_id', targetUserId)
      .single();

    if (!targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profileId = targetProfile.id;
    const targetName = targetProfile.nome;
    const targetEmail = targetProfile.email;

    // Delete related data in order (using profile_id)
    // 1. Chat messages
    await supabaseAdmin
      .from('chat_messages')
      .delete()
      .or(`sender_id.eq.${profileId},client_id.eq.${profileId},professional_id.eq.${profileId}`);

    // 2. Calendar events
    await supabaseAdmin
      .from('calendar_events')
      .delete()
      .or(`user_id.eq.${profileId},client_id.eq.${profileId},professional_id.eq.${profileId}`);

    // 3. Proposals
    await supabaseAdmin
      .from('proposals')
      .delete()
      .or(`client_id.eq.${profileId},professional_id.eq.${profileId}`);

    // 4. Gcoins
    await supabaseAdmin
      .from('gcoins')
      .delete()
      .or(`client_id.eq.${profileId},professional_id.eq.${profileId}`);

    // 5. Professional records
    await supabaseAdmin
      .from('professional_records')
      .delete()
      .or(`client_id.eq.${profileId},professional_id.eq.${profileId}`);

    // 6. Professional client links
    await supabaseAdmin
      .from('professional_client_links')
      .delete()
      .or(`client_id.eq.${profileId},professional_id.eq.${profileId}`);

    // 7. Secretary links
    await supabaseAdmin
      .from('secretary_links')
      .delete()
      .or(`secretary_id.eq.${profileId},professional_id.eq.${profileId}`);

    // 8. Dependent links
    await supabaseAdmin
      .from('dependent_links')
      .delete()
      .or(`dependent_id.eq.${profileId},responsible_id.eq.${profileId}`);

    // 9. Notifications
    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', profileId);

    // 10. User roles (using auth user_id)
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', targetUserId);

    // 11. Profile
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', targetUserId);

    // 12. Delete from auth.users
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      return new Response(
        JSON.stringify({ error: 'Erro ao excluir usuário do sistema de autenticação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get caller's profile for audit
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, nome')
      .eq('user_id', callerId)
      .single();

    // 13. Log action in audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: callerProfile?.id,
      user_nome: callerProfile?.nome || 'Admin',
      user_role: 'admin',
      acao: 'exclusao_conta',
      descricao: `Conta de ${targetName} (${targetEmail || 'sem email'}) excluída permanentemente`,
      entidade_tipo: 'usuario',
      entidade_id: profileId,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Usuário ${targetName} excluído com sucesso`,
        deleted_user: {
          id: profileId,
          nome: targetName,
          email: targetEmail
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-delete-user:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

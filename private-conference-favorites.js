/* ATLAS ELE private conference favorites client.
   Activate ONLY after a Supabase backend has been configured, migration is applied,
   and an administrator has been assigned atlas_role=admin in app_metadata.
   Never publish a service_role key or admin password in this repository.
   Requires a Supabase client supplied by the hosting page.
*/
export function createPrivateConferenceFavorites(supabase) {
  if (!supabase || !supabase.auth || !supabase.from) throw Error('Supabase client is required');
  async function owner() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) throw Error('Sign in required');
    // This client-side check is UX only; database RLS enforces authorization.
    if (data.user.app_metadata?.atlas_role !== 'admin') throw Error('Administrator access required');
    return data.user.id;
  }
  return {
    async signIn(email) {
      if (!/^\S+@\S+\.\S+$/.test(email)) throw Error('Valid email required');
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: new URL('/conferencias.html', window.location.origin).href }
      });
      if (error) throw error;
      return true;
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    async list() {
      await owner();
      const { data, error } = await supabase.from('atlas_conference_favorites')
        .select('event_id,notify_registration,created_at').order('created_at');
      if (error) throw error;
      return data;
    },
    async save(eventId, notifyRegistration = true) {
      const userId = await owner();
      if (!eventId || eventId.length > 160) throw Error('Invalid event ID');
      const { error } = await supabase.from('atlas_conference_favorites')
        .upsert({user_id:userId,event_id:eventId,notify_registration:!!notifyRegistration},
          {onConflict:'user_id,event_id'});
      if (error) throw error;
    },
    async remove(eventId) {
      const userId = await owner();
      const { error } = await supabase.from('atlas_conference_favorites')
        .delete().eq('user_id',userId).eq('event_id',eventId);
      if (error) throw error;
    }
  };
}

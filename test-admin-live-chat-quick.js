// Quick test script to verify admin live chat access
// Run this in browser console after logging in as admin

console.log('🧪 Testing Admin Live Chat Access...');

// Test authentication
const testAuth = async () => {
    try {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        console.log('👤 Current user:', user?.email, user?.id);

        if (!user) {
            console.error('❌ Not authenticated');
            return false;
        }

        // Check profile role
        const { data: profile, error: profileError } = await window.supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        console.log('🔐 User role:', profile?.role);

        if (profile?.role !== 'admin') {
            console.error('❌ User is not admin');
            return false;
        }

        // Test support tickets query
        const { data: tickets, error: ticketsError } = await window.supabase
            .from('support_tickets')
            .select('*')
            .limit(5);

        if (ticketsError) {
            console.error('❌ Tickets query error:', ticketsError);
            return false;
        }

        console.log('🎫 Support tickets:', tickets.length);

        // Test live chat tickets specifically
        const liveChats = tickets.filter(t => t.subject.includes('Live Chat'));
        console.log('💬 Live chat tickets:', liveChats.length);

        console.log('✅ All tests passed! Admin access working.');
        return true;

    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
};

// Run the test
testAuth();

// Clear Auth Session Script
// Run this in your browser console to clear any corrupted Supabase authentication sessions

console.log('🧹 Clearing Supabase authentication sessions...');

// Clear localStorage
localStorage.removeItem('supabase-auth-token');
localStorage.removeItem('sb-localhost-auth-token');
localStorage.removeItem('sb-127.0.0.1-auth-token');

// Clear sessionStorage
sessionStorage.removeItem('supabase-auth-token');
sessionStorage.removeItem('sb-localhost-auth-token');
sessionStorage.removeItem('sb-127.0.0.1-auth-token');

// Clear any other potential Supabase storage keys
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
    }
}

keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed: ${key}`);
});

console.log('✅ Authentication sessions cleared!');
console.log('🔄 Please refresh the page and log in again.');
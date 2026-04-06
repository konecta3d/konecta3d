const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://trvfspbzqolnbzbsklvw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRydmZzcGJ6cW9sbmJ6YnNrbHZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE2NjQ3NiwiZXhwIjoyMDg2NzQyNDc2fQ.5HPU_2EYJ3fl-gPctxdeoGRtb2dOLV3ODqPai16KBNY';

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function resetPassword() {
  const email = 'udarafisioterapia@gmail.com';
  const newPassword = 'Udar2024!';
  
  // List users
  console.log('Listing users...');
  const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  console.log('Users found:', usersList.users.length);
  
  const existingUser = usersList.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  
  if (existingUser) {
    console.log('User found:', existingUser.email, existingUser.id);
    
    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      { password: newPassword }
    );
    
    if (updateError) {
      console.error('Error updating password:', updateError);
    } else {
      console.log('Password updated successfully!');
    }
  } else {
    console.log('User not found, creating new user...');
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: newPassword,
      email_confirm: true,
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
    } else {
      console.log('User created successfully!', newUser);
    }
  }
}

resetPassword();

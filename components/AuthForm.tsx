'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

export default function AuthForm() {
  return (
    <div className="max-w-md mx-auto p-8">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme="dark"
        providers={[]}
        redirectTo={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`}
      />
    </div>
  )
}

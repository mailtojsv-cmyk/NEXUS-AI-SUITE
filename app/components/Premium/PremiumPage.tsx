'use client';

import { useState } from 'react';
import { useStore } from '@/app/lib/store';
import { supabase } from '@/app/lib/supabase';
import { isPremium } from '@/app/lib/auth';

export default function PremiumPage() {
  const { user, addNotification } = useStore();
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const requestPremium = async () => {
    if (!phoneNumber) {
      alert('Please enter your phone number');
      return;
    }

    setLoading(true);

    try {
      let screenshotUrl = null;

      if (screenshot) {
        const fileName = `premium_${user?.id}_${Date.now()}.${screenshot.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('premium-screenshots')
          .upload(fileName, screenshot);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('premium-screenshots')
            .getPublicUrl(fileName);
          screenshotUrl = urlData.publicUrl;
        }
      }

      await supabase.from('premium_requests').insert({
        user_id: user?.id,
        screenshot_url: screenshotUrl,
        phone_number: phoneNumber,
        status: 'pending',
      });

      addNotification({
        type: 'success',
        message: 'Premium request submitted! We will review it shortly.',
      });

      setScreenshot(null);
      setPhoneNumber('');
    } catch (error: any) {
      addNotification({ type: 'error', message: 'Failed to submit request' });
    }

    setLoading(false);
  };

  if (isPremium(user)) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass p-8 rounded-xl text-center">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-3xl font-bold gradient-text mb-4">You're Premium!</h2>
          <p className="text-gray-400 mb-6">
            Enjoy unlimited access to all features including GPT-4o, Claude, team collaboration, and
            more.
          </p>

          {user?.premium_expires_at && (
            <div className="glass p-4 rounded-lg">
              <div className="text-sm text-gray-400">Premium valid until</div>
              <div className="text-xl font-bold text-green-400">
                {new Date(user.premium_expires_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold gradient-text mb-2">Upgrade to Premium</h2>
        <p className="text-gray-400">Unlock powerful features for just ₹33/month</p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: '🚀', title: 'GPT-4o & Claude 3.5', desc: 'Access to most powerful AI models' },
          { icon: '👥', title: 'Team Collaboration', desc: 'Real-time chat with teammates' },
          { icon: '💾', title: 'Unlimited Storage', desc: 'Save unlimited projects & designs' },
          { icon: '📞', title: '24/7 Support', desc: 'Dedicated manager for assistance' },
          { icon: '🎨', title: 'Advanced Tools', desc: 'All premium features unlocked' },
          { icon: '🔒', title: 'Priority Access', desc: 'Faster response times' },
        ].map((feature, i) => (
          <div key={i} className="glass p-5 rounded-lg">
            <div className="text-3xl mb-2">{feature.icon}</div>
            <div className="font-bold mb-1">{feature.title}</div>
            <div className="text-sm text-gray-400">{feature.desc}</div>
          </div>
        ))}
      </div>

      {/* Payment Instructions */}
      <div className="glass p-8 rounded-xl">
        <h3 className="text-2xl font-bold mb-4">How to Subscribe</h3>

        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <div className="font-semibold mb-1">Send WhatsApp Message</div>
              <div className="text-sm text-gray-400">
                Send the word <strong className="text-white">"PREMIUM"</strong> to
              </div>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_PREMIUM_WHATSAPP?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl font-bold text-green-400 hover:text-green-300"
              >
                📱 {process.env.NEXT_PUBLIC_PREMIUM_WHATSAPP}
              </a>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <div className="font-semibold mb-1">Pay ₹33</div>
              <div className="text-sm text-gray-400">
                You'll receive payment details via WhatsApp. Pay via UPI/PhonePe/GPay.
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <div className="font-semibold mb-1">Submit Payment Proof</div>
              <div className="text-sm text-gray-400 mb-3">
                Upload screenshot of payment below
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                className="mb-3"
              />

              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Your phone number (for verification)"
                className="w-full mb-3"
              />

              {screenshot && (
                <div className="text-sm text-green-400 mb-3">✓ Screenshot uploaded</div>
              )}

              <button
                onClick={requestPremium}
                disabled={loading || !screenshot || !phoneNumber}
                className="btn btn-primary w-full"
              >
                {loading ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center font-bold flex-shrink-0">
              4
            </div>
            <div>
              <div className="font-semibold mb-1">Get Activated</div>
              <div className="text-sm text-gray-400">
                Admin will verify and activate your premium within 24 hours!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="glass p-6 rounded-xl text-center">
        <div className="text-4xl font-bold text-green-400 mb-2">₹33/month</div>
        <div className="text-gray-400">Cancel anytime • No hidden fees</div>
      </div>
    </div>
  );
}

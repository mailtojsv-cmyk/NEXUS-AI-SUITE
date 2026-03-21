'use client';

import { useStore } from '@/app/lib/store';
import { supabase } from '@/app/lib/supabase';
import { useState } from 'react';

export default function TermsPopup() {
  const { user, setUser, setShowTermsPopup } = useStore();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      alert('Please accept the terms to continue');
      return;
    }

    // Update user in database
    await supabase
      .from('users')
      .update({ accepted_terms: true })
      .eq('id', user?.id);

    // Update local state
    setUser({ ...user, accepted_terms: true });
    setShowTermsPopup(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          Terms & Conditions
        </h2>

        <div className="max-h-96 overflow-y-auto mb-6 space-y-4 text-sm text-gray-300">
          <section>
            <h3 className="font-bold text-lg text-white mb-2">1. Acceptance of Terms</h3>
            <p>
              By accessing Nexus AI Suite, you agree to these terms. If you disagree with any part,
              please do not use our platform.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-white mb-2">2. User Eligibility</h3>
            <p>You must be at least 13 years old to use this platform.</p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-white mb-2">3. Data Privacy Commitment</h3>
            <p className="font-semibold text-green-400">
              ✅ WE WILL NEVER SELL YOUR DATA
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Your chat history is stored securely and encrypted</li>
              <li>Only you can access your saved projects</li>
              <li>We don't share data with third parties</li>
              <li>You can delete your account anytime</li>
              <li>All data stored on Supabase (EU servers, GDPR compliant)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg text-white mb-2">4. Prohibited Content</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>No hate speech, harassment, or bullying</li>
              <li>No adult/NSFW content</li>
              <li>No spam or malicious code</li>
              <li>No cheating or academic dishonesty</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg text-white mb-2">5. Account Suspension</h3>
            <p>
              Moderators can suspend accounts for 1-14 days for violating terms. Super admin can
              permanently ban accounts.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-white mb-2">6. Premium Membership</h3>
            <p>
              Premium costs ₹33/month. Payment via WhatsApp message to +91 8604330934. Non-refundable
              after activation.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-white mb-2">7. Intellectual Property</h3>
            <p>
              You retain rights to your content (code, designs, chats). Nexus AI Suite retains rights
              to the platform software.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-white mb-2">8. Disclaimer</h3>
            <p>
              AI responses may contain errors. Always verify critical information. We're not liable for
              decisions made based on AI suggestions.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-white mb-2">9. Contact</h3>
            <p>
              Questions? Email: <strong>dhairya07012012@gmail.com</strong>
            </p>
          </section>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="accept"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="accept" className="text-sm">
            I have read and agree to the Terms & Conditions and Privacy Policy
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            disabled={!accepted}
            className="flex-1 btn btn-primary"
          >
            Accept & Continue
          </button>
        </div>

        <div className="mt-4 text-xs text-center text-gray-400">
          Last updated: June 2025
        </div>
      </div>
    </div>
  );
}

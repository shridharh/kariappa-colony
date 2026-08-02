'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const initialForm = {
  full_name: '',
  mobile_number: '',
  plot_number: '',
  applicant_status: '',
  amount_paid: '',
  purchase_year: '',
  village_taluk: '',
  notes: '',
  consent_given: false,
  consent_name: '',
  website: '', // honeypot
};

export default function Page() {
  const [form, setForm] = useState(initialForm);
  const [stats, setStats] = useState(null); // { total_count, total_amount }
  const [status, setStatus] = useState(null); // { type: 'ok' | 'err', text }
  const [submitting, setSubmitting] = useState(false);

  const configured = !!supabase;

  async function loadStats() {
    if (!supabase) return;
    const { data, error } = await supabase.rpc('get_registry_stats');
    if (!error && data && data[0]) setStats(data[0]);
  }

  useEffect(() => {
    loadStats();
  }, []);

  function formatRupees(n) {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    // honeypot — silently drop likely bot submissions
    if (form.website.trim() !== '') return;

    if (!/^[0-9]{10}$/.test(form.mobile_number.trim())) {
      setStatus({
        type: 'err',
        text: 'Please enter a valid 10-digit mobile number. / ದಯವಿಟ್ಟು ಸರಿಯಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.',
      });
      return;
    }
    if (!form.consent_given) {
      setStatus({
        type: 'err',
        text: 'Please check the consent box to continue. / ದಯವಿಟ್ಟು ಒಪ್ಪಿಗೆ ಪೆಟ್ಟಿಗೆಯನ್ನು ಗುರುತಿಸಿ.',
      });
      return;
    }
    if (!supabase) {
      setStatus({
        type: 'err',
        text: 'The site is not connected to the database yet. Please contact the organizer.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        mobile_number: form.mobile_number.trim(),
        plot_number: form.plot_number.trim() || null,
        applicant_status: form.applicant_status,
        amount_paid: form.amount_paid ? Number(form.amount_paid) : null,
        purchase_year: form.purchase_year ? Number(form.purchase_year) : null,
        village_taluk: form.village_taluk.trim() || null,
        notes: form.notes.trim() || null,
        consent_given: form.consent_given,
        consent_name: form.consent_name.trim(),
      };

      const { error } = await supabase.from('complainants').insert([payload]);
      if (error) throw error;

      setStatus({
        type: 'ok',
        text: 'Thank you — your details have been added to the register. / ಧನ್ಯವಾದಗಳು, ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ.',
      });
      setForm(initialForm);
      loadStats();
    } catch (err) {
      console.error(err);
      setStatus({
        type: 'err',
        text: 'Something went wrong submitting your details. Please try again in a moment. / ದೋಷ ಸಂಭವಿಸಿದೆ, ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="top">
        <div className="inner">
          <div className="eyebrow">Buyer Registry &middot; ಖರೀದಿದಾರರ ನೋಂದಣಿ</div>
          <h1>
            <span className="kn-line">ಫೀಲ್ಡ್ ಮಾರ್ಷಲ್ ಕರಿಯಪ್ಪ ಕಾಲೋನಿ</span>
            Affected Buyers — Sign the Register
          </h1>
          <p className="sub kn">
            ಪೊಲೀಸ್ ಅಧೀಕ್ಷಕರಿಗೆ ಸಲ್ಲಿಸಲಾಗುವ ಮನವಿಗಾಗಿ ಪೀಡಿತ ಖರೀದಿದಾರರ ಪಟ್ಟಿ
            ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ. ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಕೆಳಗೆ ಸೇರಿಸಿ.
          </p>
          <p className="sub">
            We&apos;re building the list of affected buyers to attach to the
            complaint to the Superintendent of Police, Vijayapura District.
            Add your details below — it takes about a minute.
          </p>
          <div className="register-count">
            <span className="dot"></span>
            <span>
              {stats === null
                ? 'Register open — be one of the first to sign'
                : `${stats.total_count} buyers registered · ${formatRupees(
                    stats.total_amount
                  )} reported paid so far`}
            </span>
          </div>
        </div>
      </header>

      {!configured && (
        <div className="config-warning">
          Supabase environment variables aren&apos;t detected. If you&apos;re
          the site owner: for local development, run{' '}
          <code>vercel env pull .env.local</code>; on Vercel, confirm the
          Supabase integration is connected to this project.
        </div>
      )}

      <div className="wrap">
        <section className="notice">
          <h2>
            Your privacy &middot; <span className="kn">ಗೌಪ್ಯತೆ</span>
          </h2>
          <p>
            Only the organizing group of petitioners can see submitted
            entries — this page cannot list or search anyone else&apos;s
            details. Your information will be compiled into the printed
            annexure for the police complaint, where physical signatures
            will still be collected separately before filing.
          </p>
          <p className="kn">
            ಸಲ್ಲಿಸಿದ ವಿವರಗಳನ್ನು ಸಂಘಟಿಸುತ್ತಿರುವ ಖರೀದಿದಾರರ ಗುಂಪು ಮಾತ್ರ
            ನೋಡಬಹುದು. ಈ ವಿವರಗಳನ್ನು ಪೊಲೀಸ್ ದೂರಿನ ಲಗತ್ತಿಗಾಗಿ ಸಿದ್ಧಪಡಿಸಲಾಗುವುದು;
            ದೂರು ಸಲ್ಲಿಸುವ ಮುನ್ನ ಭೌತಿಕ ಸಹಿಯನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುವುದು.
          </p>
        </section>

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* honeypot */}
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
            />
          </div>

          <div className="row-num">
            <div className="num">01</div>
            <div className="field">
              <label htmlFor="full_name">
                Full name <span className="req">*</span>
                <span className="kn-sub">ಪೂರ್ಣ ಹೆಸರು</span>
              </label>
              <input
                type="text"
                id="full_name"
                required
                maxLength={120}
                placeholder="e.g. Ramesh K. / ರಮೇಶ್ ಕೆ."
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
              />
            </div>
          </div>

          <div className="row-num">
            <div className="num">02</div>
            <div className="field">
              <label htmlFor="mobile_number">
                Mobile number <span className="req">*</span>
                <span className="kn-sub">ಮೊಬೈಲ್ ಸಂಖ್ಯೆ</span>
              </label>
              <input
                type="tel"
                id="mobile_number"
                required
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="10-digit number"
                value={form.mobile_number}
                onChange={(e) => update('mobile_number', e.target.value)}
              />
              <div className="hint">
                10 digits, no spaces &middot; used only to contact you about
                the complaint
              </div>
            </div>
          </div>

          <div className="row-num">
            <div className="num">03</div>
            <div className="field">
              <label htmlFor="plot_number">
                Plot / site number
                <span className="kn-sub">ನಿವೇಶನ ಸಂಖ್ಯೆ</span>
              </label>
              <input
                type="text"
                id="plot_number"
                maxLength={40}
                placeholder="e.g. Site No. 214 (leave blank if unsure)"
                value={form.plot_number}
                onChange={(e) => update('plot_number', e.target.value)}
              />
            </div>
          </div>

          <div className="row-num">
            <div className="num">04</div>
            <div className="field">
              <label htmlFor="applicant_status">
                You are a <span className="req">*</span>
                <span className="kn-sub">ನೀವು</span>
              </label>
              <select
                id="applicant_status"
                required
                value={form.applicant_status}
                onChange={(e) => update('applicant_status', e.target.value)}
              >
                <option value="" disabled>
                  Select one
                </option>
                <option value="serving_army">
                  Serving Army personnel &middot; ಸೇವೆಯಲ್ಲಿರುವ ಸೈನಿಕ
                </option>
                <option value="retired_army">
                  Retired Army personnel &middot; ನಿವೃತ್ತ ಸೈನಿಕ
                </option>
                <option value="family">
                  Family member of Army personnel &middot; ಸೈನಿಕರ ಕುಟುಂಬ
                  ಸದಸ್ಯ
                </option>
                <option value="civilian">
                  Civilian buyer &middot; ನಾಗರಿಕ ಖರೀದಿದಾರ
                </option>
                <option value="other">Other &middot; ಇತರೆ</option>
              </select>
            </div>
          </div>

          <div className="row-num">
            <div className="num">05</div>
            <div className="field">
              <label htmlFor="amount_paid">
                Total amount paid so far (₹)
                <span className="kn-sub">ಒಟ್ಟು ಪಾವತಿಸಿದ ಮೊತ್ತ</span>
              </label>
              <input
                type="number"
                id="amount_paid"
                min="0"
                step="1"
                placeholder="e.g. 250000"
                value={form.amount_paid}
                onChange={(e) => update('amount_paid', e.target.value)}
              />
            </div>
          </div>

          <div className="row-num">
            <div className="num">06</div>
            <div className="field">
              <label htmlFor="purchase_year">
                Year of purchase
                <span className="kn-sub">ಖರೀದಿಸಿದ ವರ್ಷ</span>
              </label>
              <input
                type="number"
                id="purchase_year"
                min="2015"
                max="2026"
                step="1"
                placeholder="e.g. 2023"
                value={form.purchase_year}
                onChange={(e) => update('purchase_year', e.target.value)}
              />
            </div>
          </div>

          <div className="row-num">
            <div className="num">07</div>
            <div className="field">
              <label htmlFor="village_taluk">
                Village / Taluk (optional)
                <span className="kn-sub">ಗ್ರಾಮ / ತಾಲೂಕು</span>
              </label>
              <input
                type="text"
                id="village_taluk"
                maxLength={80}
                value={form.village_taluk}
                onChange={(e) => update('village_taluk', e.target.value)}
              />
            </div>
          </div>

          <div className="row-num">
            <div className="num">08</div>
            <div className="field">
              <label htmlFor="notes">
                Anything else you&apos;d like to add (optional)
                <span className="kn-sub">ಹೆಚ್ಚುವರಿ ಮಾಹಿತಿ</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                maxLength={600}
                placeholder="e.g. refund promised on DD/MM/YYYY but not received"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
              />
            </div>
          </div>

          <div className="consent-block">
            <div className="consent-row">
              <input
                type="checkbox"
                id="consent_given"
                required
                checked={form.consent_given}
                onChange={(e) => update('consent_given', e.target.checked)}
              />
              <p>
                I consent to my name, mobile number and plot number being
                included in the list of affected buyers submitted to the
                Superintendent of Police, Vijayapura District, in connection
                with this matter.
                <br />
                <span className="kn">
                  ಈ ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ನನ್ನ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು
                  ನಿವೇಶನ ಸಂಖ್ಯೆಯನ್ನು ಪೊಲೀಸ್ ಅಧೀಕ್ಷಕರಿಗೆ ಸಲ್ಲಿಸುವ ಪೀಡಿತ
                  ಖರೀದಿದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ಸೇರಿಸಲು ನಾನು ಒಪ್ಪುತ್ತೇನೆ.
                </span>
              </p>
            </div>
            <div className="field" style={{ marginTop: 14, paddingBottom: 0 }}>
              <label htmlFor="consent_name">
                Type your full name to confirm <span className="req">*</span>
                <span className="kn-sub">ದೃಢೀಕರಣಕ್ಕಾಗಿ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ</span>
              </label>
              <input
                type="text"
                id="consent_name"
                required
                maxLength={120}
                value={form.consent_name}
                onChange={(e) => update('consent_name', e.target.value)}
              />
            </div>
          </div>

          <div className="submit-row">
            <button type="submit" disabled={submitting}>
              {submitting
                ? 'Adding…'
                : 'Add my details to the register  /  ಪಟ್ಟಿಗೆ ಸೇರಿಸಿ'}
            </button>
            {status && <div id="status" className={status.type}>{status.text}</div>}
          </div>
        </form>
      </div>

      <footer className="foot">
        This is an independent register maintained by affected buyers of
        Field Marshal Kariyappa Colony. It is not an official Karnataka
        Police or government website.
      </footer>
    </>
  );
}
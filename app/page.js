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
  refund_requested: false,
  refund_requested_date: '',
  notes: '',
  consent_given: false,
  consent_name: '',
  website: '', // honeypot
};

const PERCENT_OPTIONS = [0, 25, 50, 75, 100];

export default function Page() {
  const [activeTab, setActiveTab] = useState('register');

  const [form, setForm] = useState(initialForm);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [devStats, setDevStats] = useState(null);
  const [devPercent, setDevPercent] = useState(null);
  const [devNote, setDevNote] = useState('');
  const [devStatus, setDevStatus] = useState(null);
  const [devSubmitting, setDevSubmitting] = useState(false);

  const configured = !!supabase;

  async function loadStats() {
    if (!supabase) return;
    const { data, error } = await supabase.rpc('get_registry_stats');
    if (!error && data && data[0]) setStats(data[0]);
  }

  async function loadDevStats() {
    if (!supabase) return;
    const { data, error } = await supabase.rpc('get_development_stats');
    if (!error && data && data[0]) setDevStats(data[0]);
  }

  useEffect(() => {
    loadStats();
    loadDevStats();
  }, []);

  function formatRupees(n) {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
  }

  function formatDuration(days) {
    const d = Number(days || 0);
    if (d < 30) return `${d} day${d === 1 ? '' : 's'}`;
    if (d < 365) {
      const months = Math.round(d / 30);
      return `${months} month${months === 1 ? '' : 's'}`;
    }
    const years = Math.floor(d / 365);
    const remMonths = Math.round((d % 365) / 30);
    return remMonths > 0
      ? `${years} yr${years === 1 ? '' : 's'} ${remMonths} mo`
      : `${years} yr${years === 1 ? '' : 's'}`;
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

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
    if (form.refund_requested && !form.refund_requested_date) {
      setStatus({
        type: 'err',
        text: 'Please enter the date you requested the refund. / ದಯವಿಟ್ಟು ಮರುಪಾವತಿ ಕೇಳಿದ ದಿನಾಂಕ ನಮೂದಿಸಿ.',
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
        refund_requested: form.refund_requested,
        refund_requested_date: form.refund_requested
          ? form.refund_requested_date
          : null,
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

  async function handleDevSubmit(e) {
    e.preventDefault();
    setDevStatus(null);

    if (devPercent === null) {
      setDevStatus({
        type: 'err',
        text: 'Please select how much development you have personally observed. / ದಯವಿಟ್ಟು ಒಂದು ಆಯ್ಕೆ ಮಾಡಿ.',
      });
      return;
    }
    if (!supabase) {
      setDevStatus({
        type: 'err',
        text: 'The site is not connected to the database yet.',
      });
      return;
    }

    setDevSubmitting(true);
    try {
      const { error } = await supabase.from('development_reports').insert([
        { percent_complete: devPercent, note: devNote.trim() || null },
      ]);
      if (error) throw error;

      setDevStatus({
        type: 'ok',
        text: 'Thanks — your observation has been recorded. / ಧನ್ಯವಾದಗಳು, ದಾಖಲಿಸಲಾಗಿದೆ.',
      });
      setDevPercent(null);
      setDevNote('');
      loadDevStats();
    } catch (err) {
      console.error(err);
      setDevStatus({
        type: 'err',
        text: 'Something went wrong. Please try again. / ದೋಷ ಸಂಭವಿಸಿದೆ.',
      });
    } finally {
      setDevSubmitting(false);
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
            ಈ ಯೋಜನೆಯಿಂದ ಎಷ್ಟು ಖರೀದಿದಾರರು ಪೀಡಿತರಾಗಿದ್ದಾರೆ ಎಂಬುದರ ದಾಖಲೆ
            ಇಟ್ಟುಕೊಳ್ಳಲು ಈ ನೋಂದಣಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ. ಅಗತ್ಯವಿದ್ದಲ್ಲಿ
            ಮುಂದೆ ಪೊಲೀಸ್ ಅಧೀಕ್ಷಕರಿಗೆ ಸಲ್ಲಿಸುವ ಮನವಿಗೆ ಇದನ್ನು ಬಳಸಬಹುದು.
          </p>
          <p className="sub">
            We&apos;re keeping a record of how many buyers have been
            affected by this project. This may be used later to support a
            formal complaint to the Superintendent of Police, Vijayapura
            District, if it becomes necessary — for now, we just need an
            accurate count. Add your details below — it takes about a
            minute.
          </p>

          <div className="pill-row">
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

            {stats && stats.refund_pending_count > 0 && (
              <div className="register-count alert">
                <span className="dot"></span>
                <span>
                  ⚠ {stats.refund_pending_count} refund
                  {stats.refund_pending_count === 1 ? '' : 's'} still pending
                  {stats.oldest_refund_days > 0
                    ? ` · oldest waiting ${formatDuration(
                        stats.oldest_refund_days
                      )}`
                    : ''}
                </span>
              </div>
            )}

            {devStats && devStats.report_count > 0 && (
              <div className="register-count info">
                <span className="dot"></span>
                <span>
                  🏗 Development reported {devStats.avg_percent}% complete
                  &middot; {devStats.report_count} report
                  {devStats.report_count === 1 ? '' : 's'}
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className="tab-bar">
          <div className="tab-bar-inner">
            <button
              className={activeTab === 'register' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('register')}
              type="button"
            >
              Register &middot; <span className="kn">ನೋಂದಣಿ</span>
            </button>
            <button
              className={activeTab === 'status' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('status')}
              type="button"
            >
              Development Status &middot; <span className="kn">ಅಭಿವೃದ್ಧಿ ಸ್ಥಿತಿ</span>
            </button>
            <button
              className={activeTab === 'letter' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('letter')}
              type="button"
            >
              Complaint Letter &middot; <span className="kn">ದೂರು ಪತ್ರ</span>
            </button>
            <button
              className={activeTab === 'about' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('about')}
              type="button"
            >
              About this site &middot; <span className="kn">ಜಾಲತಾಣದ ಬಗ್ಗೆ</span>
            </button>
          </div>
        </nav>
      </header>

      {!configured && (
        <div className="config-warning">
          Supabase environment variables aren&apos;t detected. If you&apos;re
          the site owner: for local development, run{' '}
          <code>vercel env pull .env.local</code>; on Vercel, confirm the
          Supabase integration is connected to this project.
        </div>
      )}

      {activeTab === 'register' && (
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
              ನೋಡಬಹುದು. ಈ ವಿವರಗಳನ್ನು ಪೊಲೀಸ್ ದೂರಿನ ಲಗತ್ತಿಗಾಗಿ
              ಸಿದ್ಧಪಡಿಸಲಾಗುವುದು; ದೂರು ಸಲ್ಲಿಸುವ ಮುನ್ನ ಭೌತಿಕ ಸಹಿಯನ್ನು
              ಪ್ರತ್ಯೇಕವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗುವುದು.
            </p>
          </section>

          <form onSubmit={handleSubmit} autoComplete="off">
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
                  10 digits, no spaces &middot; used only to contact you
                  about the complaint
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
                  onChange={(e) =>
                    update('applicant_status', e.target.value)
                  }
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

            <div className="refund-block">
              <div className="refund-row">
                <input
                  type="checkbox"
                  id="refund_requested"
                  checked={form.refund_requested}
                  onChange={(e) =>
                    update('refund_requested', e.target.checked)
                  }
                />
                <label htmlFor="refund_requested" className="refund-label">
                  I requested a refund / booking cancellation and have{' '}
                  <strong>not</strong> received it yet
                  <span className="kn-sub" style={{ marginTop: 4 }}>
                    ನಾನು ಹಣ ಮರುಪಾವತಿ / ಬುಕ್ಕಿಂಗ್ ರದ್ದತಿ ಕೇಳಿದ್ದೇನೆ, ಇನ್ನೂ
                    ಸಿಕ್ಕಿಲ್ಲ
                  </span>
                </label>
              </div>

              {form.refund_requested && (
                <div
                  className="field"
                  style={{ marginTop: 14, paddingBottom: 0 }}
                >
                  <label htmlFor="refund_requested_date">
                    Date you requested the refund{' '}
                    <span className="req">*</span>
                    <span className="kn-sub">ಮರುಪಾವತಿ ಕೇಳಿದ ದಿನಾಂಕ</span>
                  </label>
                  <input
                    type="date"
                    id="refund_requested_date"
                    required={form.refund_requested}
                    max={new Date().toISOString().split('T')[0]}
                    value={form.refund_requested_date}
                    onChange={(e) =>
                      update('refund_requested_date', e.target.value)
                    }
                  />
                </div>
              )}
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
                  onChange={(e) =>
                    update('consent_given', e.target.checked)
                  }
                />
                <p>
                  I consent to my name, mobile number and plot number being
                  included in the list of affected buyers submitted to the
                  Superintendent of Police, Vijayapura District, in
                  connection with this matter.
                  <br />
                  <span className="kn">
                    ಈ ವಿಷಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ ನನ್ನ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು
                    ನಿವೇಶನ ಸಂಖ್ಯೆಯನ್ನು ಪೊಲೀಸ್ ಅಧೀಕ್ಷಕರಿಗೆ ಸಲ್ಲಿಸುವ ಪೀಡಿತ
                    ಖರೀದಿದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ಸೇರಿಸಲು ನಾನು ಒಪ್ಪುತ್ತೇನೆ.
                  </span>
                </p>
              </div>
              <div
                className="field"
                style={{ marginTop: 14, paddingBottom: 0 }}
              >
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
              {status && (
                <div id="status" className={status.type}>
                  {status.text}
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {activeTab === 'status' && (
        <div className="wrap">
          <section className="notice">
            <h2>
              Why this exists &middot; <span className="kn">ಏಕೆ</span>
            </h2>
            <p>
              The demand is simple: either the developer completes the
              development work that was promised, or refunds buyers who no
              longer want to wait — with interest, since this money has
              been held for years without the promised development. This
              tracker lets any registered buyer report what they have
              personally observed at the site, so there&apos;s a running,
              crowd-sourced record — not just the developer&apos;s word.
            </p>
            <p className="kn">
              ಬೇಡಿಕೆ ಸರಳವಾಗಿದೆ: ಡೆವಲಪರ್ ಭರವಸೆ ನೀಡಿದ ಅಭಿವೃದ್ಧಿ ಕಾಮಗಾರಿಯನ್ನು
              ಪೂರ್ಣಗೊಳಿಸಬೇಕು, ಇಲ್ಲದಿದ್ದರೆ ಕಾಯಲು ಬಯಸದ ಖರೀದಿದಾರರಿಗೆ ಬಡ್ಡಿ
              ಸಮೇತ ಹಣ ಮರುಪಾವತಿಸಬೇಕು — ಏಕೆಂದರೆ ಭರವಸೆ ನೀಡಿದ ಅಭಿವೃದ್ಧಿ ಇಲ್ಲದೆ
              ಈ ಹಣವನ್ನು ವರ್ಷಗಳಿಂದ ಇಟ್ಟುಕೊಳ್ಳಲಾಗಿದೆ.
            </p>
          </section>

          <div className="dev-progress-card">
            <div className="dev-progress-label">
              <span>Reported development progress</span>
              <span className="dev-progress-pct">
                {devStats ? `${devStats.avg_percent}%` : '—'}
              </span>
            </div>
            <div className="dev-progress-track">
              <div
                className="dev-progress-fill"
                style={{ width: `${devStats ? devStats.avg_percent : 0}%` }}
              />
            </div>
            <div className="dev-progress-meta">
              {devStats && devStats.report_count > 0
                ? `Based on ${devStats.report_count} buyer report${
                    devStats.report_count === 1 ? '' : 's'
                  }`
                : 'No reports yet — be the first to add one'}
            </div>
          </div>

          <form onSubmit={handleDevSubmit} className="dev-form">
            <label className="dev-form-label">
              How much of the promised development have you personally seen
              completed?
              <span className="kn-sub" style={{ marginTop: 4 }}>
                ನೀವು ಸ್ವತಃ ಎಷ್ಟು ಅಭಿವೃದ್ಧಿ ಕಾಮಗಾರಿ ಪೂರ್ಣಗೊಂಡಿರುವುದನ್ನು
                ಕಂಡಿದ್ದೀರಿ?
              </span>
            </label>
            <div className="percent-options">
              {PERCENT_OPTIONS.map((p) => (
                <button
                  type="button"
                  key={p}
                  className={
                    devPercent === p
                      ? 'percent-btn active'
                      : 'percent-btn'
                  }
                  onClick={() => setDevPercent(p)}
                >
                  {p}%
                </button>
              ))}
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="dev_note">
                Optional note (what you saw, when)
                <span className="kn-sub">ಐಚ್ಛಿಕ ಟಿಪ್ಪಣಿ</span>
              </label>
              <textarea
                id="dev_note"
                rows={2}
                maxLength={400}
                placeholder="e.g. visited in July 2026, still no water connection"
                value={devNote}
                onChange={(e) => setDevNote(e.target.value)}
              />
            </div>

            <div className="submit-row" style={{ padding: '14px 0 0' }}>
              <button type="submit" disabled={devSubmitting}>
                {devSubmitting ? 'Submitting…' : 'Submit my observation'}
              </button>
              {devStatus && (
                <div id="status" className={devStatus.type}>
                  {devStatus.text}
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {activeTab === 'letter' && (
        <div className="wrap">
          <section className="notice">
            <h2>
              Complaint letter &middot; <span className="kn">ದೂರು ಪತ್ರ</span>
            </h2>
            <p>
              This is the draft petition being prepared for the
              Superintendent of Police, Vijayapura District. You can read it
              below or download a copy.
            </p>
          </section>

          <div className="pdf-actions">
            <a
              href="/complaint-letter.pdf"
              download
              className="download-btn"
            >
              ⬇ Download PDF &middot; <span className="kn">ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ</span>
            </a>
          </div>

          <div className="pdf-embed">
            <object
              data="/complaint-letter.pdf"
              type="application/pdf"
              width="100%"
              height="100%"
            >
              <p style={{ padding: 20 }}>
                Your browser can&apos;t preview PDFs inline.{' '}
                <a href="/complaint-letter.pdf" download>
                  Download the letter directly
                </a>
                .
              </p>
            </object>
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="wrap">
          <section className="notice">
            <h2>
              Why this website exists &middot;{' '}
              <span className="kn">ಈ ಜಾಲತಾಣ ಏಕೆ</span>
            </h2>
            <p>
              Many of the affected buyers are serving or retired army
              personnel posted in different locations, not all in
              Vijayapura. A physical signature sheet would take months to
              circulate. This site lets any affected buyer add their name,
              mobile number, and plot number in under a minute from their
              phone, so a complete list could be compiled quickly for the
              complaint to the Superintendent of Police.
            </p>
            <p className="kn">
              ಪೀಡಿತ ಖರೀದಿದಾರರಲ್ಲಿ ಅನೇಕರು ಸೇವೆಯಲ್ಲಿರುವ ಅಥವಾ ನಿವೃತ್ತ
              ಸೈನಿಕರಾಗಿದ್ದು, ವಿವಿಧ ಸ್ಥಳಗಳಲ್ಲಿ ನೆಲೆಸಿದ್ದಾರೆ — ಎಲ್ಲರೂ
              ವಿಜಯಪುರದಲ್ಲಿ ಇಲ್ಲ. ಭೌತಿಕ ಸಹಿ ಪಟ್ಟಿ ಸಂಗ್ರಹಿಸಲು ತಿಂಗಳುಗಳೇ
              ಬೇಕಾಗುತ್ತಿತ್ತು. ಈ ಜಾಲತಾಣದ ಮೂಲಕ ಯಾವುದೇ ಪೀಡಿತ ಖರೀದಿದಾರರು ಒಂದು
              ನಿಮಿಷದೊಳಗೆ ತಮ್ಮ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು ನಿವೇಶನ ಸಂಖ್ಯೆಯನ್ನು
              ಸೇರಿಸಬಹುದು.
            </p>
          </section>

          <section className="notice">
            <h2>
              What information is collected, and why &middot;{' '}
              <span className="kn">ಯಾವ ಮಾಹಿತಿ, ಏಕೆ</span>
            </h2>
            <p>
              Name, mobile number, plot number, amount paid, and whether a
              refund has been requested — exactly the information the
              complaint&apos;s annexure list requires (ಕ್ರಮ ಸಂಖ್ಯೆ / ಹೆಸರು /
              ಮೊಬೈಲ್ ಸಂಖ್ಯೆ / ನಿವೇಶನ ಸಂಖ್ಯೆ). Each person explicitly
              consents before submitting, and types their name to confirm.
            </p>
            <p className="kn">
              ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ನಿವೇಶನ ಸಂಖ್ಯೆ, ಪಾವತಿಸಿದ ಮೊತ್ತ, ಮತ್ತು
              ಮರುಪಾವತಿ ಕೇಳಿದ್ದಾರೆಯೇ ಎಂಬ ಮಾಹಿತಿ — ದೂರಿನ ಲಗತ್ತಿಗೆ
              ಅಗತ್ಯವಿರುವ ಮಾಹಿತಿ ಮಾತ್ರ. ಪ್ರತಿಯೊಬ್ಬರೂ ಸಲ್ಲಿಸುವ ಮೊದಲು
              ಸ್ಪಷ್ಟವಾಗಿ ಒಪ್ಪಿಗೆ ನೀಡುತ್ತಾರೆ ಮತ್ತು ದೃಢೀಕರಣಕ್ಕಾಗಿ ತಮ್ಮ ಹೆಸರು
              ಟೈಪ್ ಮಾಡುತ್ತಾರೆ.
            </p>
          </section>

          <section className="notice">
            <h2>
              What happens to the data &middot;{' '}
              <span className="kn">ಮಾಹಿತಿಗೆ ಏನಾಗುತ್ತದೆ</span>
            </h2>
            <p>
              It is stored in a private database that only the organizing
              group can access — the website itself cannot show anyone
              their own or anyone else&apos;s entries back. It will be
              compiled into the printed list attached to the police
              complaint. Physical, wet-ink signatures will still be
              collected from each person before the complaint is formally
              filed — this site is how the list was compiled quickly, not a
              replacement for actual signatures. The data is not used
              commercially, sold, or shared with any third party.
            </p>
            <p className="kn">
              ಇದನ್ನು ಖಾಸಗಿ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸಂಗ್ರಹಿಸಲಾಗಿದ್ದು, ಸಂಘಟಿಸುತ್ತಿರುವ
              ಗುಂಪು ಮಾತ್ರ ಅದನ್ನು ಪ್ರವೇಶಿಸಬಹುದು. ಇದನ್ನು ಪೊಲೀಸ್ ದೂರಿನ
              ಲಗತ್ತಿಗಾಗಿ ಮುದ್ರಿತ ಪಟ್ಟಿಯಾಗಿ ಸಂಕಲಿಸಲಾಗುವುದು. ದೂರು ಸಲ್ಲಿಸುವ
              ಮೊದಲು ಪ್ರತಿಯೊಬ್ಬರಿಂದ ಭೌತಿಕ ಸಹಿಯನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ
              ಸಂಗ್ರಹಿಸಲಾಗುವುದು. ಈ ಮಾಹಿತಿಯನ್ನು ವಾಣಿಜ್ಯ ಉದ್ದೇಶಕ್ಕೆ
              ಬಳಸುವುದಿಲ್ಲ, ಮಾರಾಟ ಮಾಡುವುದಿಲ್ಲ, ಅಥವಾ ಯಾವುದೇ ಮೂರನೇ ವ್ಯಕ್ತಿಗೆ
              ಹಂಚಿಕೊಳ್ಳುವುದಿಲ್ಲ.
            </p>
          </section>

          <section className="notice">
            <h2>
              A note on the Development Status numbers &middot;{' '}
              <span className="kn">ಅಭಿವೃದ್ಧಿ ಸ್ಥಿತಿ ಬಗ್ಗೆ ಟಿಪ್ಪಣಿ</span>
            </h2>
            <p>
              The percentages on the Development Status tab are
              self-reported observations from buyers who visited the site,
              not verified survey data or an official audit. Useful as a
              general signal of what people are seeing on the ground, but
              not proof on its own.
            </p>
            <p className="kn">
              ಅಭಿವೃದ್ಧಿ ಸ್ಥಿತಿ ಟ್ಯಾಬ್‌ನಲ್ಲಿನ ಶೇಕಡಾವಾರುಗಳು ಸ್ಥಳಕ್ಕೆ
              ಭೇಟಿ ನೀಡಿದ ಖರೀದಿದಾರರ ಸ್ವಯಂ-ವರದಿ ಮಾಡಿದ ಅವಲೋಕನಗಳಾಗಿವೆ —
              ಪರಿಶೀಲಿಸಿದ ಸಮೀಕ್ಷಾ ಮಾಹಿತಿ ಅಥವಾ ಅಧಿಕೃತ ಲೆಕ್ಕಪರಿಶೋಧನೆ ಅಲ್ಲ.
            </p>
          </section>
        </div>
      )}

      <footer className="foot">
      This is an independent register maintained by affected buyers of Field Marshal Kariyappa Colony. It is not an official government website
      </footer>
    </>
  );
}
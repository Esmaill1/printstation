import { useState, useEffect, useCallback, useRef } from 'react';
import { KioskMark, TrayArrow, CelebrateMark } from './icons';
import { API_BASE, BACKEND_ORIGIN } from '../api';

// Sound effect using Web Audio API for realistic touch keypad clicks
function playBeep(frequency = 800, duration = 0.05, type = 'sine') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio might be blocked before first interaction
  }
}

export default function KioskScreen({ onSwitchView }) {
  const [pin, setPin] = useState('');
  const [kioskState, setKioskState] = useState('idle'); // idle | looking_up | confirm | printing | dispensed
  const [jobInfo, setJobInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [printProgress, setPrintProgress] = useState(0);
  const [currentSheet, setCurrentSheet] = useState(0);
  const [totalSheets, setTotalSheets] = useState(1);
  const [paperLevel, setPaperLevel] = useState(485);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [pendingDemoJobs, setPendingDemoJobs] = useState([]);
  const [countdown, setCountdown] = useState(15);
  const countdownTimerRef = useRef(null);

  // Virtual & Hardware Printers
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('Virtual Kiosk Tray Spooler (Default)');
  const [spoolResult, setSpoolResult] = useState(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch detected printers from Backend HAL
  const fetchPrinters = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/kiosk/printers`);
      if (res.ok) {
        const data = await res.json();
        setPrinters(data);
        const def = data.find((p) => p.is_default);
        if (def) setSelectedPrinter(def.name);
      }
    } catch {
      // Backend might be offline
    }
  }, []);

  // Fetch pending jobs for quick demo helper
  const fetchPendingJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/kiosk/jobs/pending?kiosk_id=kiosk-001`);
      if (res.ok) {
        const data = await res.json();
        setPendingDemoJobs(data);
      }
    } catch {
      // Backend might be offline
    }
  }, []);

  useEffect(() => {
    fetchPrinters();
    fetchPendingJobs();
    const interval = setInterval(fetchPendingJobs, 5000);
    return () => clearInterval(interval);
  }, [fetchPrinters, fetchPendingJobs]);

  // Keypad click handler
  const handleKeypadPress = useCallback((val) => {
    playBeep(650, 0.04);
    setErrorMsg(null);

    if (val === 'clear') {
      setPin('');
      return;
    }
    if (val === 'backspace') {
      setPin((prev) => prev.slice(0, -1));
      return;
    }

    if (pin.length < 6) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 6) {
        lookupCode(newPin);
      }
    }
  }, [pin]);

  // Physical keyboard listener
  useEffect(() => {
    if (kioskState !== 'idle') return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeypadPress('backspace');
      } else if (e.key === 'Escape') {
        handleKeypadPress('clear');
      } else if (e.key === 'Enter' && pin.length === 6) {
        lookupCode(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [kioskState, pin, handleKeypadPress]);

  // Lookup 6-digit code
  const lookupCode = async (codeToLookup) => {
    setKioskState('looking_up');
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/kiosk/lookup?code=${encodeURIComponent(codeToLookup.trim())}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        playBeep(250, 0.2, 'sawtooth');
        setErrorMsg(body.detail || 'Code not found. Check the 6-digit code and try again.');
        setKioskState('idle');
        return;
      }

      const data = await res.json();
      if (data.status !== 'paid') {
        playBeep(300, 0.15);
        setErrorMsg(`This job is '${data.status}'. Only paid jobs can be printed.`);
        setKioskState('idle');
        return;
      }

      playBeep(900, 0.1);
      setJobInfo(data);
      setKioskState('confirm');
    } catch {
      setErrorMsg('Connection error. Is the backend server running?');
      setKioskState('idle');
    }
  };

  // Start real mechanical & virtual spool printing sequence
  const startPrinting = async () => {
    if (!jobInfo) return;

    setKioskState('printing');
    setPrintProgress(0);
    const total = (jobInfo.total_pages || 1) * (jobInfo.copies || 1);
    setTotalSheets(total);
    setCurrentSheet(1);

    try {
      // 1. Claim job lock on backend
      await fetch(`${API_BASE}/kiosk/jobs/${jobInfo.job_id}/claim?kiosk_id=kiosk-001`, {
        method: 'POST',
      });

      // 2. Dispatch real print spooling through Printer HAL
      const spoolPromise = fetch(
        `${API_BASE}/kiosk/jobs/${jobInfo.job_id}/spool?printer_name=${encodeURIComponent(selectedPrinter)}&kiosk_id=kiosk-001`,
        { method: 'POST' }
      ).then(async (r) => {
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData.detail || 'Printer spooling failed');
        }
        return r.json();
      });

      // 3. Realistic mechanical simulation step loop (visual sheets feeding through rollers)
      const stepDuration = Math.max(40, Math.min(800, 3000 / total)); // dynamically scale so large uncapped jobs complete smoothly
      for (let s = 1; s <= total; s++) {
        setCurrentSheet(s);
        if (s <= 20 || s % 5 === 0) playBeep(440 + (s % 10) * 40, 0.05, 'triangle');
        for (let p = 0; p <= 100; p += 20) {
          await new Promise((r) => setTimeout(r, stepDuration / 5));
          const overallProgress = Math.min(95, Math.round(((s - 1) / total) * 100 + (p / 100) * (100 / total)));
          setPrintProgress(overallProgress);
        }
      }

      // Wait for the real spooler to finish writing to disk
      const spoolData = await spoolPromise;
      setSpoolResult(spoolData);
      setPrintProgress(100);

      // Update local paper tray count (auto-refill if depleted)
      setPaperLevel((prev) => {
        const remaining = prev - total;
        return remaining > 0 ? remaining : 500;
      });
      playBeep(1046, 0.25); // Victory chime

      setKioskState('dispensed');
      setCountdown(15);

      // Auto countdown to return to idle
      countdownTimerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownTimerRef.current);
            resetKiosk();
            return 15;
          }
          return c - 1;
        });
      }, 1000);

    } catch (err) {
      setErrorMsg(`Printing error: ${err.message}`);
      setKioskState('idle');
    }
  };

  const resetKiosk = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setPin('');
    setJobInfo(null);
    setSpoolResult(null);
    setErrorMsg(null);
    setPrintProgress(0);
    setKioskState('idle');
    fetchPendingJobs();
  };

  const refillPaper = () => {
    playBeep(1200, 0.1);
    setPaperLevel(500);
  };

  return (
    <div className="kiosk-bezel">
      {/* Physical Kiosk Bezel Header */}
      <div className="kiosk-bezel-header">
        <div className="kiosk-brand">
          <span className="kiosk-icon"><KioskMark /></span>
          <div>
            <h2 className="kiosk-title">PrintStation Kiosk #01</h2>
            <span className="kiosk-location">Campus Library · Main Entrance Hall</span>
          </div>
        </div>

        <div className="kiosk-telemetry">
          <div className="telemetry-item">
            <span className="telemetry-dot online"></span>
            <span>Online</span>
          </div>
          <div className="telemetry-item" onClick={refillPaper} title="Click to refill paper tray" role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && refillPaper()}>
            <span className="telemetry-label">Paper:</span>
            <span className={`telemetry-val ${paperLevel < 50 ? 'warning' : ''}`}>
              {paperLevel}/500
            </span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">Toner:</span>
            <span className="telemetry-val">94%</span>
          </div>
          <div className="telemetry-item kiosk-clock">
            {currentTime}
          </div>
        </div>
      </div>

      {/* Main Touchscreen Glass Area */}
      <div className="kiosk-touchscreen">
        {/* VIEW 1: IDLE / PIN ENTRY */}
        {kioskState === 'idle' && (
          <div className="kiosk-flow-container">
            <div className="kiosk-welcome-banner">
              <span className="kiosk-instruction-icon">Collect your prints</span>
              <h1>Enter your 6-digit pickup code</h1>
              <p>The code was generated when you paid in the student portal</p>
            </div>

            {/* PIN Boxes */}
            <div className="pin-display-wrapper">
              <div className="pin-boxes">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const digit = pin[idx];
                  const isActive = idx === pin.length;
                  return (
                    <div
                      key={idx}
                      className={`pin-box ${digit ? 'filled' : ''} ${isActive ? 'active-slot' : ''}`}
                      aria-hidden="true"
                    >
                      {digit ? digit : isActive ? <span className="pin-cursor">|</span> : ''}
                    </div>
                  );
                })}
              </div>
              {pin.length > 0 && (
                <button className="pin-quick-clear" onClick={() => handleKeypadPress('clear')}>
                  Clear
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="kiosk-error-alert" role="alert">
                {errorMsg}
              </div>
            )}

            {/* Virtual Touch Keypad */}
            <div className="touch-keypad">
              <div className="keypad-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className="keypad-btn"
                    onClick={() => handleKeypadPress(num.toString())}
                  >
                    <span className="btn-digit">{num}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="keypad-btn keypad-action btn-clear"
                  onClick={() => handleKeypadPress('clear')}
                  title="Clear entry"
                >
                  <span className="btn-label">CLEAR</span>
                </button>
                <button
                  type="button"
                  className="keypad-btn"
                  onClick={() => handleKeypadPress('0')}
                >
                  <span className="btn-digit">0</span>
                </button>
                <button
                  type="button"
                  className="keypad-btn keypad-action btn-backspace"
                  onClick={() => handleKeypadPress('backspace')}
                  title="Backspace"
                >
                  <span className="btn-label">⌫ DEL</span>
                </button>
              </div>
            </div>

            {/* Demo Quick-Fill Bar */}
            <div className="kiosk-demo-bar">
              <span className="demo-tag">Demo</span>
              <span>Paid jobs ready:</span>
              {pendingDemoJobs.length > 0 ? (
                <button
                  className="demo-pill-btn"
                  onClick={() => {
                    fetch(`${API_BASE}/jobs/${pendingDemoJobs[0].job_id}`)
                      .then((r) => r.json())
                      .then((j) => {
                        if (j.pickup_code) {
                          setPin(j.pickup_code);
                          lookupCode(j.pickup_code);
                        }
                      });
                  }}
                >
                  Load #{pendingDemoJobs[0].job_id} ({pendingDemoJobs[0].filename})
                </button>
              ) : (
                <span className="demo-hint">
                  Upload & pay a document in <strong>Student View</strong> to get a pickup code
                </span>
              )}
            </div>
          </div>
        )}

        {/* VIEW 1.5: LOOKING UP */}
        {kioskState === 'looking_up' && (
          <div className="kiosk-loading-view">
            <div className="kiosk-spinner" aria-label="Looking up code"></div>
            <h2>Checking code {pin}...</h2>
            <p>Verifying with the PrintStation server...</p>
          </div>
        )}

        {/* VIEW 2: CONFIRMATION / JOB FOUND */}
        {kioskState === 'confirm' && jobInfo && (
          <div className="kiosk-confirm-view">
            <div className="confirm-badge">Print job ready</div>
            <h2>Confirm your document</h2>
            <p className="kiosk-subhead">Check the job details and pick a printer.</p>

            <div className="kiosk-job-card">
              <div className="job-card-row">
                <span className="job-card-label">Document</span>
                <span className="job-card-value">{jobInfo.filename}</span>
              </div>
              <div className="job-card-row">
                <span className="job-card-label">Sheets to print</span>
                <span className="job-card-value highlight-sheets">
                  {jobInfo.total_pages}
                </span>
              </div>
              <div className="job-card-row">
                <span className="job-card-label">Copies</span>
                <span className="job-card-value">{jobInfo.copies || 1}</span>
              </div>
              <div className="job-card-row">
                <span className="job-card-label">Job ID</span>
                <span className="job-card-value">#{jobInfo.job_id}</span>
              </div>

              {/* Hardware / Virtual Printer Selector */}
              <div className="job-card-row printer-row">
                <span className="job-card-label">Printer hardware</span>
                <select
                  className="kiosk-printer-select"
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  aria-label="Select printer hardware"
                >
                  {printers.length > 0 ? (
                    printers.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.type === 'system' ? '(Windows Hardware)' : '(Virtual Tray)'}
                      </option>
                    ))
                  ) : (
                    <option value="Virtual Kiosk Tray Spooler (Default)">
                      Virtual Kiosk Tray Spooler (Default)
                    </option>
                  )}
                </select>
              </div>

              <div className="job-card-row">
                <span className="job-card-label">Payment</span>
                <span className="status-pill-paid">Paid & verified</span>
              </div>
            </div>

            <div className="kiosk-actions-row">
              <button className="kiosk-btn kiosk-btn-cancel" onClick={resetKiosk}>
                ← Cancel & re-enter code
              </button>
              <button className="kiosk-btn kiosk-btn-print" onClick={startPrinting}>
                Start printing
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: PRINTING IN PROGRESS (REAL MECHANICAL SIMULATION) */}
        {kioskState === 'printing' && (
          <div className="kiosk-printing-view">
            <div className="printing-header">
              <h2>Printing your document...</h2>
              <p>
                {selectedPrinter} · Sheet {currentSheet} of {totalSheets}
              </p>
            </div>

            {/* Visual Hardware Printer Cross-Section */}
            <div className="hardware-simulator-box">
              <div className="printer-assembly">
                {/* Paper Feed Tray */}
                <div className="assembly-tray feed-tray">
                  <span className="tray-label">Feed tray</span>
                  <div className="tray-paper-stack">
                    <div className="paper-sheet in-stack"></div>
                    <div className="paper-sheet in-stack"></div>
                    <div className="paper-sheet in-stack"></div>
                  </div>
                </div>

                {/* Rotating Rollers & Laser Chamber */}
                <div className="assembly-chamber">
                  <div className="roller roller-top rotating-clockwise" aria-hidden="true"></div>
                  <div className="laser-beam-sweep" aria-hidden="true"></div>
                  <div className="moving-paper-sheet">
                    <span className="sheet-text">{currentSheet}/{totalSheets}</span>
                  </div>
                  <div className="roller roller-bottom rotating-clockwise" aria-hidden="true"></div>
                </div>

                {/* Output Collection Tray */}
                <div className="assembly-tray output-tray">
                  <span className="tray-label">Output tray</span>
                  <div className="output-drop-zone active">
                    <span className="tray-sensor">Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="kiosk-progress-container">
              <div className="progress-numbers">
                <span>Spooling {jobInfo?.filename}</span>
                <span className="progress-percent">{printProgress}%</span>
              </div>
              <div
                className="kiosk-progress-track"
                role="progressbar"
                aria-valuenow={printProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="kiosk-progress-fill" style={{ width: `${printProgress}%` }}></div>
              </div>
              <span className="print-hint">
                OS spooler active · producing verified sheets
              </span>
            </div>
          </div>
        )}

        {/* VIEW 4: DISPENSED / REAL PHYSICAL OUTPUT */}
        {kioskState === 'dispensed' && (
          <div className="kiosk-dispensed-view">
            <span className="dispense-success-icon"><CelebrateMark /></span>
            <h1>Printing complete</h1>
            <p className="dispense-instruction">
              <strong>{totalSheets}</strong> printed sheet{totalSheets === 1 ? '' : 's'} produced and verified.
            </p>

            {/* Real Spooler Telemetry Card */}
            {spoolResult && (
              <div className="spool-receipt-box">
                <div className="receipt-header">
                  <span className="receipt-badge">KIOSK PRINT RECEIPT</span>
                </div>
                <div className="receipt-row">
                  <span>Spooler job</span>
                  <strong>{spoolResult.spool_id}</strong>
                </div>
                <div className="receipt-row">
                  <span>Hardware device</span>
                  <span>{spoolResult.printer_name}</span>
                </div>
                <div className="receipt-row">
                  <span>Sheets produced</span>
                  <span>{spoolResult.total_sheets}</span>
                </div>
                <div className="receipt-row">
                  <span>Output file</span>
                  <span className="file-pill" title={spoolResult.output_path}>
                    {spoolResult.output_filename}
                  </span>
                </div>

                {/* View Real Printed PDF Button */}
                {spoolResult.output_url && (
                  <a
                    href={`${BACKEND_ORIGIN}${spoolResult.output_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-view-printed-doc"
                  >
                    Open printed output PDF →
                  </a>
                )}
              </div>
            )}

            <div className="tray-highlight-animation">
              <div className="tray-box">
                <div className="tray-glow" aria-hidden="true"></div>
                <span className="tray-arrow"><TrayArrow /></span>
                <span className="tray-text">COLLECT PAPERS FROM THE TRAY</span>
              </div>
            </div>

            <div className="dispense-footer">
              <p className="countdown-text">
                Screen resets in <strong>{countdown}s</strong>
              </p>
              <button className="kiosk-btn kiosk-btn-done" onClick={resetKiosk}>
                ✓ Finished — next student
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Physical Kiosk Bezel Bottom Bar */}
      <div className="kiosk-bezel-footer">
        <div className="bezel-slot-instruction">
          <span>Output paper tray below · kiosk-simulator/printed_output/</span>
        </div>
        <button className="kiosk-switch-btn" onClick={onSwitchView}>
          Switch to Student Portal →
        </button>
      </div>
    </div>
  );
}


import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

import {
  ScanLine,
  Camera,
  Keyboard,
  Search,
  RefreshCw
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { PageHeading, ErrorMessage } from "../components/UI";

export default function Scan() {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);

  const starting = useRef(false);
  const decoded = useRef(false);
  const mounted = useRef(false);

  const [running, setRunning] = useState(false);
  const [manual, setManual] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const nav = useNavigate();

  // Component cleanup
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;

      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }

      const video = videoRef.current;

      if (video) {
        video.pause();

        if (video.srcObject) {
          video.srcObject.getTracks().forEach((track) => {
            track.stop();
          });

          video.srcObject = null;
        }
      }
    };
  }, []);

  // Stop camera safely
  function stop() {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }

    const video = videoRef.current;

    if (video) {
      video.pause();

      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => {
          track.stop();
        });

        video.srcObject = null;
      }
    }

    if (mounted.current) {
      setRunning(false);
    }
  }

  // Start barcode scanner
  async function start() {
    if (starting.current || controlsRef.current) return;

    starting.current = true;
    decoded.current = false;
    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera is not supported by this browser."
        );
      }

      // Create reader without custom rotation hints
      const reader = new BrowserMultiFormatReader();

      // Find available cameras
      const devices =
        await navigator.mediaDevices.enumerateDevices();

      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      if (videoDevices.length === 0) {
        throw new Error("No camera detected.");
      }

      // Prefer rear camera when available
      const camera =
        videoDevices.find((device) =>
          /back|rear|environment/i.test(device.label)
        ) || videoDevices[0];

      console.log(
        "Selected camera:",
        camera.label || camera.deviceId
      );

      if (!videoRef.current) {
        throw new Error("Camera preview element not found.");
      }

      // Start scanning
      const controls = await reader.decodeFromVideoDevice(
        camera.deviceId,
        videoRef.current,
        (result, scanError) => {
          if (result && !decoded.current) {
            decoded.current = true;

            const value = result.getText().trim();

            console.log("Barcode detected:", value);

            if (mounted.current) {
              setManual(value);
            }

            stop();

            if (mounted.current) {
              lookup(value);
            }
          }
        }
      );

      controlsRef.current = controls;

      if (!mounted.current) {
        controls.stop();
        controlsRef.current = null;
        return;
      }

      setRunning(true);

    } catch (e) {
      console.error("ZXing camera error:", e);

      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }

      const video = videoRef.current;

      if (video?.srcObject) {
        video.srcObject.getTracks().forEach((track) => {
          track.stop();
        });

        video.srcObject = null;
      }

      if (mounted.current) {
        setRunning(false);
        setError(
          e.message ||
          "Camera could not start. Check camera permission."
        );
      }

    } finally {
      starting.current = false;
    }
  }

  // Find student using Student ID
  async function lookup(value) {
    const studentId = value.trim();

    if (!studentId) {
      setError("Enter or scan a Student ID.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const d = await api(
        `/students/${encodeURIComponent(studentId)}`
      );

      nav(
        `/students/${encodeURIComponent(
          d.student.student_id
        )}`
      );

    } catch (e) {
      setError(e.message);

    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="IDENTIFICATION"
        title="Scan Student ID"
        description="Scan the barcode printed on a student's ID card."
      />

      <div className="scan-layout">

        {/* Barcode Scanner Section */}
        <section className="panel scanner-panel">

          <div className="scanner-title">
            <div className="scan-round">
              <ScanLine />
            </div>

            <div>
              <h3>Barcode Scanner</h3>
              <p>
                Position the student's barcode in front
                of the camera.
              </p>
            </div>
          </div>

          <div className="qr-reader">

            {!running && (
              <div className="scanner-placeholder">
                <Camera size={34} />
                <b>Camera preview</b>
                <span>
                  Start the camera to begin scanning
                </span>
              </div>
            )}

            <video
              ref={videoRef}
              muted
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: running ? "block" : "none"
              }}
            />

          </div>

          <div className="scanner-actions">

            <button
              className="btn primary"
              onClick={start}
              disabled={running || busy}
            >
              <Camera size={17} />
              {running ? "Camera active" : "Start camera"}
            </button>

            <button
              className="btn secondary"
              onClick={stop}
              disabled={!running}
            >
              <RefreshCw size={16} />
              Stop
            </button>

          </div>

          <ErrorMessage>{error}</ErrorMessage>

        </section>

        {/* Manual Student Lookup Section */}
        <section className="panel manual-panel">

          <div className="panel-icon">
            <Keyboard />
          </div>

          <h3>Manual Lookup</h3>

          <p className="muted">
            If scanning is unavailable, enter the Student ID
            manually.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup(manual);
            }}
            className="form-stack"
          >

            <label>
              Student ID

              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Example: 25ITR042"
              />
            </label>

            <button
              className="btn primary full"
              disabled={busy || !manual.trim()}
            >
              <Search size={17} />
              {busy ? "Searching..." : "Find Student"}
            </button>

          </form>

          <div className="info-note">
            Scan barcode or enter Student ID manually.
          </div>

        </section>

      </div>
    </>
  );
}
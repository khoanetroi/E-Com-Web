"use client";

import React from "react";

const ZALO_PHONE = "0934001435";
const ZALO_LINK = `https://zalo.me/${ZALO_PHONE}`;

export default function ZaloButton() {
  return (
    <a
      href={ZALO_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat với chúng tôi qua Zalo"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "0",
        textDecoration: "none",
        animation: "zaloFadeSlideIn 0.5s ease-out 0.8s both",
      }}
    >
      {/* Main button with pulse */}
      <span
        style={{
          position: "relative",
          width: "50px",
          height: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Pulse rings */}
        <span className="zalo-ring zalo-ring-1" />
        <span className="zalo-ring zalo-ring-2" />

        {/* Blue circle with Zalo logo */}
        <span
          className="zalo-icon-circle"
          style={{
            position: "relative",
            zIndex: 2,
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "#0068FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(0, 104, 255, 0.4)",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
          }}
        >
          {/* Official-style Zalo icon */}
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Chat bubble */}
            <path
              d="M44 22.5C44 11.178 34.822 2 23.5 2S3 11.178 3 22.5c0 5.523 2.27 10.508 5.93 14.1L6 45l10.05-4.27A21.36 21.36 0 0 0 23.5 43C34.822 43 44 33.822 44 22.5Z"
              fill="white"
            />
            {/* Letter Z */}
            <path
              d="M16 16h14v3.2L19.6 28.8H30v3.2H16v-3.2L26.4 19.2H16V16Z"
              fill="#0068FF"
            />
          </svg>
        </span>
      </span>

      <style>{`
        @keyframes zaloFadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes zaloPulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.8);
            opacity: 0;
          }
        }

        .zalo-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(0, 104, 255, 0.3);
          z-index: 0;
          pointer-events: none;
        }

        .zalo-ring-1 {
          animation: zaloPulse 2s ease-out infinite;
        }

        .zalo-ring-2 {
          animation: zaloPulse 2s ease-out infinite 0.8s;
        }

        a[aria-label="Chat với chúng tôi qua Zalo"]:hover .zalo-icon-circle {
          transform: scale(1.08) !important;
          box-shadow: 0 6px 20px rgba(0, 104, 255, 0.55) !important;
        }

        a[aria-label="Chat với chúng tôi qua Zalo"]:active .zalo-icon-circle {
          transform: scale(0.95) !important;
        }
      `}</style>
    </a>
  );
}

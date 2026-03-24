"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/install", label: "Install" },
  { href: "/features", label: "Features" },
  { href: "/output", label: "Output" },
  { href: "/schema", label: "Schema" },
  { href: "/mcp", label: "MCP" },
  { href: "/api", label: "API" },
  { href: "/webhooks", label: "Webhooks" },
  { href: "/changelog", label: "Changelog" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
];

type OutputFormat = 'compact' | 'standard' | 'detailed' | 'forensic';

function MobileForensicBunny({ isForensic }: { isForensic: boolean }) {
  const [hasEntered, setHasEntered] = useState(false);
  const [forensicPerkKey, setForensicPerkKey] = useState(0);
  const prevForensicRef = useRef(isForensic);

  // Track when entrance animations complete
  useEffect(() => {
    const timer = setTimeout(() => setHasEntered(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Trigger perk animation when switching to forensic (only after entrance)
  useEffect(() => {
    if (hasEntered && isForensic && !prevForensicRef.current) {
      setForensicPerkKey(k => k + 1);
    }
    prevForensicRef.current = isForensic;
  }, [isForensic, hasEntered]);

  const color = isForensic ? '#dc2626' : 'rgba(0, 0, 0, 0.85)';

  const earLeftClass = hasEntered
    ? `mobile-ear-left-idle${isForensic ? ' forensic-perk' : ''}`
    : 'mobile-ear-left-enter';
  const earRightClass = hasEntered
    ? `mobile-ear-right-idle${isForensic ? ' forensic-perk' : ''}`
    : 'mobile-ear-right-enter';

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: isForensic ? 'scale(1.15)' : 'scale(1)',
        transformOrigin: 'center',
        transition: 'transform 0.3s ease-out',
      }}
    >
      <style>{`
        /* Entrance animations */
        @keyframes mobileBunnyEnterEar {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes mobileBunnyEnterFace {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes mobileBunnyEnterEye {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        /* Idle animations */
        @keyframes mobileLeftEarTwitch {
          0%, 9% { transform: rotate(0deg); }
          12% { transform: rotate(-8deg); }
          16%, 34% { transform: rotate(0deg); }
          38% { transform: rotate(-12deg); }
          42% { transform: rotate(-6deg); }
          48%, 100% { transform: rotate(0deg); }
        }
        @keyframes mobileRightEarTwitch {
          0%, 9% { transform: rotate(0deg); }
          12% { transform: rotate(6deg); }
          16%, 34% { transform: rotate(0deg); }
          38% { transform: rotate(10deg); }
          42% { transform: rotate(4deg); }
          48%, 71% { transform: rotate(0deg); }
          74% { transform: rotate(8deg); }
          78%, 100% { transform: rotate(0deg); }
        }
        @keyframes mobileLeftEyeMove {
          0%, 8% { transform: translate(0, 0); }
          10%, 18% { transform: translate(1.5px, 0); }
          20%, 22% { transform: translate(1.5px, 0) scaleY(0.1); }
          24%, 32% { transform: translate(1.5px, 0); }
          35%, 48% { transform: translate(-0.8px, -0.6px); }
          52%, 54% { transform: translate(0, 0) scaleY(0.1); }
          56%, 68% { transform: translate(0, 0); }
          72%, 82% { transform: translate(-0.5px, 0.5px); }
          85%, 100% { transform: translate(0, 0); }
        }
        @keyframes mobileRightEyeMove {
          0%, 8% { transform: translate(0, 0); }
          10%, 18% { transform: translate(0.8px, 0); }
          20%, 22% { transform: translate(0.8px, 0) scaleY(0.1); }
          24%, 32% { transform: translate(0.8px, 0); }
          35%, 48% { transform: translate(-1.5px, -0.6px); }
          52%, 54% { transform: translate(0, 0) scaleY(0.1); }
          56%, 68% { transform: translate(0, 0); }
          72%, 82% { transform: translate(-1.2px, 0.5px); }
          85%, 100% { transform: translate(0, 0); }
        }
        /* Forensic ear perk */
        @keyframes mobileForensicLeftEarPerk {
          0% { transform: rotate(0deg) translateY(0); }
          15% { transform: rotate(-25deg) translateY(-2px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        @keyframes mobileForensicRightEarPerk {
          0% { transform: rotate(0deg) translateY(0); }
          15% { transform: rotate(25deg) translateY(-2px); }
          100% { transform: rotate(0deg) translateY(0); }
        }
        /* Entrance state */
        .mobile-ear-left-enter {
          opacity: 0;
          animation: mobileBunnyEnterEar 0.3s ease-out 0.1s forwards, mobileLeftEarTwitch 5s ease-in-out 0.4s infinite;
          transform-origin: bottom center;
          transform-box: fill-box;
        }
        .mobile-ear-right-enter {
          opacity: 0;
          animation: mobileBunnyEnterEar 0.3s ease-out 0.15s forwards, mobileRightEarTwitch 5s ease-in-out 0.45s infinite;
          transform-origin: bottom center;
          transform-box: fill-box;
        }
        /* Idle state (after entrance) */
        .mobile-ear-left-idle {
          animation: mobileLeftEarTwitch 5s ease-in-out infinite;
          transform-origin: bottom center;
          transform-box: fill-box;
        }
        .mobile-ear-right-idle {
          animation: mobileRightEarTwitch 5s ease-in-out infinite;
          transform-origin: bottom center;
          transform-box: fill-box;
        }
        /* Forensic perk state (after entrance) */
        .mobile-ear-left-idle.forensic-perk {
          animation: mobileForensicLeftEarPerk 0.8s ease-out, mobileLeftEarTwitch 5s ease-in-out 0.8s infinite;
        }
        .mobile-ear-right-idle.forensic-perk {
          animation: mobileForensicRightEarPerk 0.8s ease-out, mobileRightEarTwitch 5s ease-in-out 0.8s infinite;
        }
        .mobile-face-enter {
          opacity: 0;
          animation: mobileBunnyEnterFace 0.3s ease-out 0.25s forwards;
          transform-origin: center;
          transform-box: fill-box;
        }
        .mobile-eye-left-enter {
          opacity: 0;
          animation: mobileBunnyEnterEye 0.3s ease-out 0.35s forwards, mobileLeftEyeMove 5s ease-in-out 0.65s infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .mobile-eye-right-enter {
          opacity: 0;
          animation: mobileBunnyEnterEye 0.3s ease-out 0.4s forwards, mobileRightEyeMove 5s ease-in-out 0.7s infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .mobile-eye-left-idle {
          animation: mobileLeftEyeMove 5s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .mobile-eye-right-idle {
          animation: mobileRightEyeMove 5s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .mobile-x-eye {
          transition: opacity 0.2s ease-out;
        }
      `}</style>
      <path
        key={isForensic ? `mobile-left-ear-forensic-${forensicPerkKey}` : 'mobile-left-ear'}
        className={earLeftClass}
        d="M3.738 10.2164L7.224 2.007H9.167L5.676 10.2164H3.738ZM10.791 6.42705C10.791 5.90346 10.726 5.42764 10.596 4.99959C10.47 4.57155 10.292 4.16643 10.063 3.78425C9.833 3.39825 9.56 3.01797 9.243 2.64343C8.926 2.26507 8.767 2.07589 8.767 2.07589L10.24 0.957996C10.24 0.957996 10.433 1.17203 10.819 1.60007C11.209 2.0243 11.559 2.49056 11.869 2.99886C12.178 3.50717 12.413 4.04222 12.574 4.60403C12.734 5.16584 12.814 5.77352 12.814 6.42705C12.814 7.10734 12.73 7.7303 12.562 8.29593C12.394 8.85774 12.153 9.3966 11.84 9.9126C11.526 10.4247 11.181 10.8833 10.802 11.2884C10.428 11.6974 10.24 11.9018 10.24 11.9018L8.767 10.7839C8.767 10.7839 8.924 10.5948 9.237 10.2164C9.554 9.8419 9.83 9.4597 10.063 9.06985C10.3 8.6762 10.479 8.26726 10.602 7.84304C10.728 7.41499 10.791 6.943 10.791 6.42705Z"
        fill={color}
        style={{ transition: 'fill 0.2s ease-out' }}
      />
      <path
        key={isForensic ? `mobile-right-ear-forensic-${forensicPerkKey}` : 'mobile-right-ear'}
        className={earRightClass}
        d="M15.003 10.2164L18.489 2.007H20.432L16.941 10.2164H15.003ZM22.056 6.42705C22.056 5.90346 21.991 5.42764 21.861 4.99959C21.735 4.57155 21.557 4.16643 21.328 3.78425C21.098 3.39825 20.825 3.01797 20.508 2.64343C20.191 2.26507 20.032 2.07589 20.032 2.07589L21.505 0.957996C21.505 0.957996 21.698 1.17203 22.084 1.60007C22.474 2.0243 22.824 2.49056 23.133 2.99886C23.443 3.50717 23.678 4.04222 23.839 4.60403C23.999 5.16584 24.079 5.77352 24.079 6.42705C24.079 7.10734 23.995 7.7303 23.827 8.29593C23.659 8.85774 23.418 9.3966 23.105 9.9126C22.791 10.4247 22.445 10.8833 22.067 11.2884C21.693 11.6974 21.505 11.9018 21.505 11.9018L20.032 10.7839C20.032 10.7839 20.189 10.5948 20.502 10.2164C20.819 9.8419 21.094 9.4597 21.328 9.06985C21.565 8.6762 21.744 8.26726 21.866 7.84304C21.993 7.41499 22.056 6.943 22.056 6.42705Z"
        fill={color}
        style={{ transition: 'fill 0.2s ease-out' }}
      />
      <path
        className={hasEntered ? '' : 'mobile-face-enter'}
        d="M2.03 20.4328C2.03 20.9564 2.093 21.4322 2.219 21.8602C2.345 22.2883 2.523 22.6953 2.752 23.0813C2.981 23.4635 3.254 23.8419 3.572 24.2164C3.889 24.5948 4.047 24.7839 4.047 24.7839L2.574 25.9018C2.574 25.9018 2.379 25.6878 1.989 25.2598C1.603 24.8355 1.256 24.3693 0.946 23.861C0.636 23.3527 0.401 22.8176 0.241 22.2558C0.08 21.694 0 21.0863 0 20.4328C0 19.7525 0.084 19.1314 0.252 18.5696C0.421 18.004 0.661 17.4651 0.975 16.953C1.288 16.4371 1.632 15.9765 2.007 15.5714C2.385 15.1625 2.574 14.958 2.574 14.958L4.047 16.0759C4.047 16.0759 3.889 16.2651 3.572 16.6434C3.258 17.018 2.983 17.4021 2.746 17.7957C2.513 18.1855 2.335 18.5945 2.213 19.0225C2.091 19.4467 2.03 19.9168 2.03 20.4328ZM23.687 20.4271C23.687 19.9035 23.622 19.4276 23.492 18.9996C23.366 18.5715 23.188 18.1664 22.959 17.7843C22.729 17.3982 22.456 17.018 22.139 16.6434C21.822 16.2651 21.663 16.0759 21.663 16.0759L23.136 14.958C23.136 14.958 23.329 15.172 23.715 15.6001C24.105 16.0243 24.455 16.4906 24.765 16.9989C25.074 17.5072 25.309 18.0422 25.47 18.604C25.63 19.1658 25.71 19.7735 25.71 20.4271C25.71 21.1073 25.626 21.7303 25.458 22.2959C25.29 22.8577 25.049 23.3966 24.736 23.9126C24.422 24.4247 24.077 24.8833 23.698 25.2884C23.324 25.6974 23.136 25.9018 23.136 25.9018L21.663 24.7839C21.663 24.7839 21.82 24.5948 22.133 24.2164C22.45 23.8419 22.726 23.4597 22.959 23.0698C23.196 22.6762 23.375 22.2673 23.498 21.843C23.624 21.415 23.687 20.943 23.687 20.4271Z"
        fill={color}
        style={{ transition: 'fill 0.2s ease-out' }}
      />
      <circle
        className={hasEntered ? 'mobile-eye-left-idle' : 'mobile-eye-left-enter'}
        cx="8.277"
        cy="20.466"
        r="1.8"
        fill={color}
        style={{ opacity: isForensic ? 0 : undefined, transition: 'fill 0.2s ease-out, opacity 0.2s ease-out' }}
      />
      <circle
        className={hasEntered ? 'mobile-eye-right-idle' : 'mobile-eye-right-enter'}
        cx="19.878"
        cy="20.466"
        r="1.8"
        fill={color}
        style={{ opacity: isForensic ? 0 : undefined, transition: 'fill 0.2s ease-out, opacity 0.2s ease-out' }}
      />
      <g className="mobile-x-eye" stroke={color} strokeWidth="1.5" strokeLinecap="round" style={{ opacity: isForensic ? 1 : 0, transition: 'opacity 0.2s ease-out, stroke 0.2s ease-out' }}>
        <line x1="6.5" y1="18.7" x2="10" y2="22.2" />
        <line x1="10" y1="18.7" x2="6.5" y2="22.2" />
      </g>
      <g className="mobile-x-eye" stroke={color} strokeWidth="1.5" strokeLinecap="round" style={{ opacity: isForensic ? 1 : 0, transition: 'opacity 0.2s ease-out, stroke 0.2s ease-out' }}>
        <line x1="18.1" y1="18.7" x2="21.6" y2="22.2" />
        <line x1="21.6" y1="18.7" x2="18.1" y2="22.2" />
      </g>
    </svg>
  );
}

function MobileTypedLogo({ isForensic }: { isForensic: boolean }) {
  const text = "/agentation";
  const [showBunny, setShowBunny] = useState(false);
  const [showText, setShowText] = useState(false);

  // Bunny entrance time before text starts
  const bunnyEntranceTime = 0.5;

  // Text delays - offset by bunny entrance time
  const delays = [
    0.1,    // /
    0.4,    // a (pause after slash)
    0.48,   // g
    0.54,   // e
    0.62,   // n
    0.7,    // t
    1.0,    // a (longer pause - "agent" + "ation")
    1.08,   // t
    1.14,   // i
    1.22,   // o
    1.3,    // n
  ].map(d => d + bunnyEntranceTime);

  useEffect(() => {
    // Show bunny immediately
    setShowBunny(true);
    // Start text after bunny entrance
    const timer = setTimeout(() => setShowText(true), bunnyEntranceTime * 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mobile-typed-logo">
      <div className={`mobile-bunny-container${showBunny ? ' show' : ''}`}>
        {showBunny && <MobileForensicBunny isForensic={isForensic} />}
      </div>
      <div>
        {showText && text.split('').map((char, i) => (
          <span
            key={i}
            className="mobile-typed-char"
            style={{
              color: i === 0 ? '#4C74FF' : 'inherit',
              animationDelay: `${delays[i] - delays[0]}s`,
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isForensic, setIsForensic] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check initial format from localStorage
    const savedFormat = localStorage.getItem('agentation-output-format');
    setIsForensic(savedFormat === 'forensic');

    // Listen for format changes
    const handleFormatChange = (e: CustomEvent<OutputFormat>) => {
      setIsForensic(e.detail === 'forensic');
    };

    window.addEventListener('agentation-format-change', handleFormatChange as EventListener);
    return () => window.removeEventListener('agentation-format-change', handleFormatChange as EventListener);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // CSS handles display:none on desktop, so always render

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-header">
        <Link href="/" style={{ display: 'flex', color: '#E5484D' }}>
          <svg width="86" height="19" viewBox="0 0 1067 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M832.549 80.1896C838.968 80.1896 844.168 74.9866 844.168 68.5681C844.168 62.1496 838.965 56.9465 832.549 56.9465C826.133 56.9465 820.928 62.1496 820.928 68.5681C820.928 74.9866 826.131 80.1896 832.549 80.1896ZM1066.51 157.056L1052.04 110.39C1048.08 97.598 1036.03 94.462 1025.74 102.584L980.318 141.571C977.981 143.416 983.432 146.27 983.844 143.898L990.826 103.517C992.507 93.7993 988.322 86.3882 975.606 86.6025L919.738 87.3272C914.986 87.4175 918.618 91.6363 918.618 96.4107C918.618 101.185 922.341 103.551 927.245 103.458L976.269 102.389C976.588 102.384 973.621 100.404 973.598 100.536L966.334 144.583C963.593 161.205 978.474 166.177 991.153 155.294L1036.58 116.306L1033.94 115.568L1048.29 161.853C1051.4 172.784 1069.63 167.987 1066.52 157.056H1066.51ZM907.439 162.344C953.906 163.182 968.24 88.1761 919.738 87.3272C872.177 86.4981 860.177 161.492 907.439 162.344ZM907.749 145.144C883.804 144.713 894.272 103.247 919.157 103.681C943.57 104.107 931.917 145.579 907.749 145.144ZM884.96 106.179C869.865 126.746 846.094 147.922 832.874 147.691C817.324 147.42 825.902 118.314 829.653 108.554C835.034 94.541 818.818 90.999 814.157 102.386C809.379 114.064 781.342 150.161 761.396 149.846C749.8 149.662 745.053 137.186 757.298 100.937L779.016 36.6392C780.572 31.6335 777.059 25.466 770.806 25.466C766.949 25.466 763.686 28.0041 762.594 31.5038L741.001 95.4322C725.572 141.112 731.105 166.617 757.174 167.031C788.875 167.536 823.666 121.132 828.432 104.473L814.439 102.386C807.191 121.258 795.826 164.273 829.473 164.862C854.865 165.305 879.081 139.53 896.026 116.351C897.07 114.927 897.685 113.173 897.685 111.273C897.685 106.521 896.652 102.668 891.901 102.668C889.052 102.668 886.528 104.05 884.963 106.182L884.96 106.179ZM793.7 56.8817L719.03 58.523C714.738 58.6047 711.286 62.1073 711.286 66.4164C711.286 70.7254 714.904 74.3944 719.334 74.3098L794.004 72.6685C798.297 72.5867 801.748 69.0842 801.748 64.7751C801.748 60.466 798.13 56.7971 793.7 56.8817ZM743.923 88.1451C723.92 142.471 695.352 155.802 684.236 155.607C676.822 155.477 674.453 151.698 675.586 139.713C676.644 128.548 662.803 123.813 656.306 132.95C648.934 143.317 638.655 153.154 625.124 152.917C601.669 152.508 611.393 111.557 646.861 112.175C659.836 112.401 669.016 118.444 672.916 126.354C674.182 128.918 676.822 130.68 679.873 130.68C684.157 130.68 687.631 127.206 687.631 122.922C687.631 121.687 687.343 120.517 686.822 119.482C680.4 106.521 666.071 96.9945 647.132 96.6645C591.421 95.6916 576.198 168.472 621.751 169.267C642.589 169.631 662.307 152.643 667.538 140.243C666.37 141.884 659.836 141.532 660.146 138.247C658.294 157.821 663.869 171.075 681.991 171.391C701.001 171.684 734.368 153.985 757.355 91.5235C759.109 86.7576 756.788 83.0633 751.204 83.0633C747.862 83.0633 745.014 85.1755 743.925 88.1394L743.923 88.1451ZM549.523 168.388C549.523 184.58 567.177 188.546 567.177 166.887C567.177 145.229 583.959 92.4823 588.497 78.2917L642.09 75.9651C656.105 75.356 653.677 59.9725 642.473 60.3701L593.793 62.096L599.794 44.1011C601.207 40.1417 602.264 36.9042 602.264 34.3831C602.264 30.0656 599.086 27.5444 595.203 27.5444C590.615 27.5444 586.731 28.9855 582.493 41.5799L575.431 63.1733L540.832 64.6143C534.831 64.9725 530.592 67.4936 530.592 72.8913C530.592 79.008 535.183 81.1682 541.537 80.81L570.135 79.3718C564.78 95.7508 549.52 147.824 549.52 168.385L549.523 168.388ZM322.659 129.504C333.556 95.6239 362.177 93.334 362.177 105.308C362.177 113.698 348.68 126.901 322.659 129.504ZM259.148 182.403C281.323 178.241 270.161 164.022 256.447 168.032C172.487 192.595 181.12 237.784 211.771 239.403C255.584 241.715 281.365 179.332 282.817 132.096C284.064 121.188 272.609 116.611 264.701 125.006C254.129 136.236 235.389 151.326 220.358 151.326C194.955 151.326 214.986 100.63 257.484 100.63C265.897 100.63 271.892 103.382 275.894 107.059C283.079 113.661 298.367 104.124 290.556 94.8907C284.693 87.9618 274.413 82.8631 258.889 82.8631C194.233 82.8631 165.815 169.375 215.823 169.375C243.339 169.375 268.596 143.932 274.498 135.599C273.319 136.614 265.643 133.354 265.973 130.466L265.251 136.786C264.924 172.66 242.628 225.102 214.893 222.197C200.135 220.652 211.413 191.363 259.151 182.401L259.148 182.403ZM9.39368 133.365L176.317 112.615C180.55 112.15 183.844 108.562 183.844 104.205C183.844 99.2026 179.411 95.2517 174.45 95.7959L7.52679 116.546C3.29385 117.011 0 120.599 0 124.956C0 129.958 4.43316 133.909 9.39368 133.365ZM153.824 178.162L164.43 15.3109C165.42 0.10504 149.54 -5.6733 139.315 6.79145L4.29498 171.43C3.01184 172.97 2.23914 174.953 2.23914 177.116C2.23914 182.023 6.21545 185.999 11.1224 185.999C13.8663 185.999 16.3198 184.755 17.9498 182.801L153.051 18.0605C154.151 16.7181 146.647 14.9584 146.7 14.1575L136.086 177.144C135.801 182.195 139.887 186.538 144.955 186.538C149.69 186.538 153.559 182.832 153.824 178.165V178.162ZM334.495 176.278C364.495 176.278 402.107 154.64 420.657 128.221C419.247 135.779 413.596 156.893 413.596 163.974C413.596 177.065 425.905 176.055 435.905 165.948L476.799 124.62L480.104 140.136C484.535 160.926 493.779 169.234 508.35 169.234C534.791 169.234 559.205 140.066 570.101 123.379L561.982 106.43C555.505 123.543 527.859 150.618 512.586 150.618C505.561 150.618 502.002 146.287 499.808 136.916L495.398 118.083C491.621 101.963 478.22 98.2776 462.809 113.275L436.681 138.701L440.564 116.109C443.392 99.651 427.301 98.1366 418.835 109.784C406.345 126.972 368.246 158.359 337.033 158.359C324.216 158.359 320.479 152.214 320.398 144.112C389.532 139.022 402.177 81.5066 356.472 81.5066C301.382 81.5066 277.312 176.275 334.49 176.275L334.495 176.278Z" fill="currentColor"/>
          </svg>
        </Link>
        <button
          className={`mobile-nav-toggle ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          <span className="mobile-nav-icon">
            <span />
            <span />
          </span>
        </button>
      </div>

      <div className={`mobile-nav-links ${isOpen ? "open" : ""}`}>
        <div className="mobile-nav-links-inner">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-nav-link ${pathname === link.href ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

import { LinkButton } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-16">
      <div className="flex flex-col items-start justify-between gap-10 rounded-[45px] bg-[#F3F3F3] px-8 py-12 md:flex-row md:items-center md:px-16 md:py-14">
        {/* Left */}
        <div className="flex max-w-[500px] flex-col gap-6">
          <h2 className="text-[28px] font-medium leading-tight text-[#191A23] md:text-[30px]">
            Run it yourself. Bid against yourself.
          </h2>
          <p className="text-base text-[#191A23]/70">
            Clone the repo, drop a dev private key into .env.local, and the
            whole auction loop — commit, prove, reveal, settle — runs in
            your browser against the live HashKey testnet deploys.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <LinkButton
              href="https://github.com/IronicDeGawd/Haskkey-SealedHash"
              target="_blank"
              rel="noreferrer"
              variant="primary"
            >
              GitHub repository
            </LinkButton>
            <LinkButton href="/dev" variant="secondary">
              Proof smoke test
            </LinkButton>
          </div>
        </div>

        {/* Right — decorative illustration */}
        <div className="h-[240px] w-[300px] flex-shrink-0 md:h-[286px] md:w-[350px]">
          <svg
            viewBox="0 0 350 286"
            fill="none"
            className="h-full w-full"
            aria-hidden="true"
          >
            {/* Starburst lines */}
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i / 16) * Math.PI * 2;
              const x1 = 220 + Math.cos(angle) * 40;
              const y1 = 100 + Math.sin(angle) * 40;
              const x2 = 220 + Math.cos(angle) * 100;
              const y2 = 100 + Math.sin(angle) * 100;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#191A23"
                  strokeWidth="1"
                  opacity="0.4"
                />
              );
            })}
            {/* Lock character — ink body, lime shackle */}
            <rect
              x="170"
              y="80"
              width="100"
              height="70"
              rx="14"
              fill="#191A23"
            />
            <rect x="190" y="104" width="12" height="24" rx="2" fill="#B9FF66" />
            <rect x="218" y="104" width="12" height="24" rx="2" fill="#B9FF66" />
            <rect x="246" y="104" width="12" height="24" rx="2" fill="#B9FF66" />
            <path
              d="M190 82v-18a30 30 0 0 1 60 0v18"
              stroke="#191A23"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Lime star */}
            <path
              d="M85 190 l8 24 24 8-24 8-8 24-8-24-24-8 24-8Z"
              fill="#B9FF66"
              stroke="#191A23"
              strokeWidth="2"
            />
            {/* Small gray star */}
            <path
              d="M300 220 l5 15 15 5-15 5-5 15-5-15-15-5 15-5Z"
              fill="#D9D9D9"
              stroke="#191A23"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>
      </div>
    </section>
  );
}

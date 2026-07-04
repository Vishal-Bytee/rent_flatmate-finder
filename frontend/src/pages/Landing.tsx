import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <p className="font-body text-sm uppercase tracking-[0.2em] text-clay">Room hunting, sorted</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] tracking-tight">
            Find a room that actually fits your life.
          </h1>
          <p className="mt-5 text-lg text-ink/70 dark:text-sand/70">
            Set your budget, your move in date, your neighborhood we score every listing against
            your profile so you skip the ones that were never going to work.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/browse" className="focus-ring rounded-lg bg-ink px-5 py-3 font-medium text-sand dark:bg-sand dark:text-ink">
              Browse rooms
            </Link>
            <Link to="/register" className="focus-ring rounded-lg border border-ink/20 px-5 py-3 font-medium dark:border-sand/20">
              List a room
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white/60 p-6 dark:border-sand/10 dark:bg-white/5">
          <p className="text-sm font-medium text-ink/60 dark:text-sand/60">Sample match</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="font-display text-2xl font-semibold">Koramangala Studio</p>
            <span className="rounded-full bg-teal px-3 py-1 text-sm font-semibold text-sand">92% match</span>
          </div>
          <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">
            Budget matches well and preferred location is exactly matched.
          </p>
        </div>
      </div>
    </div>
  );
}

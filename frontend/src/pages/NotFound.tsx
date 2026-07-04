import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-6xl font-semibold text-clay">404</p>
      <p className="mt-3 text-lg text-ink/70 dark:text-sand/70">This page wandered off somewhere.</p>
      <Link to="/" className="focus-ring mt-6 rounded-lg bg-teal px-5 py-2.5 font-medium text-sand hover:opacity-90">
        Back home
      </Link>
    </div>
  );
}

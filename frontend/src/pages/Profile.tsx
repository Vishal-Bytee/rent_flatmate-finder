import { useAuth } from "../hooks/useAuth";

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Profile</h1>
      <div className="mt-6 space-y-3 rounded-xl border border-ink/10 p-6 dark:border-sand/10">
        <div>
          <p className="text-sm text-ink/50 dark:text-sand/50">Name</p>
          <p className="font-medium">{user.name}</p>
        </div>
        <div>
          <p className="text-sm text-ink/50 dark:text-sand/50">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-ink/50 dark:text-sand/50">Role</p>
          <p className="font-medium capitalize">{user.role.toLowerCase()}</p>
        </div>
        <div>
          <p className="text-sm text-ink/50 dark:text-sand/50">Member since</p>
          <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

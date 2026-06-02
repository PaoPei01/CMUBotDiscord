import { loginAction } from "./actions";

export default function LoginPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="page">
      <div className="panel">
        <h1>Admin Login</h1>
        {searchParams.error ? (
          <p className="message message-error">Invalid admin password.</p>
        ) : null}
        <form action={loginAction} className="form-grid">
          <label className="field">
            ADMIN_PASSWORD
            <input name="password" required type="password" />
          </label>
          <div className="actions">
            <button className="button" type="submit">
              Login
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

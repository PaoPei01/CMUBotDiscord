"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="page">
      <div className="panel">
        <h1>Something went wrong</h1>
        <p className="message message-error">{error.message}</p>
        <button className="button" onClick={reset} type="button">
          Try again
        </button>
      </div>
    </main>
  );
}

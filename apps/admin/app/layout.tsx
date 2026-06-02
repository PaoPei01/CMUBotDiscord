import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import "./styles.css";

export const metadata: Metadata = {
  title: "Campus Q&A Admin",
  description: "Admin foundation for verified campus Q&A content"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="app-header">
          <Link className="brand" href="/faq">
            Campus Q&A Admin
          </Link>
          <nav>
            <Link href="/faq">FAQs</Link>
            <Link href="/faq/new">New FAQ</Link>
            <Link href="/import">Import</Link>
            <Link href="/drafts">Drafts</Link>
            <Link href="/reviews">Reviews</Link>
            <Link href="/logs">Logs</Link>
            <Link href="/missing">Missing</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

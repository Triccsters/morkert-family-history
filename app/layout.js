import "./globals.css";
import Link from "next/link";
import { site } from "../site.config";
import { ViewerProvider, ViewerPicker } from "../components/Viewer";

export const metadata = {
  title: site.title,
  description: site.tagline,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ViewerProvider>
        <header className="site">
          <div className="wrap">
            <h1>{site.title}</h1>
            <p>{site.tagline}</p>
            <nav className="site">
              <Link href="/">Overview</Link>
              <Link href="/tree">Family tree</Link>
              <Link href="/people">People</Link>
              <Link href="/places">Places</Link>
              <Link href="/events">Events</Link>
              <Link href="/evidence">Evidence</Link>
              <Link href="/corrections">Corrections</Link>
            </nav>
            <ViewerPicker />
          </div>
        </header>
        <main>
          <div className="wrap">{children}</div>
        </main>
        <footer className="site">
          <div className="wrap">
            Kept by {site.owner}. Last updated {site.updated}. Every claim on this
            site links to the record it rests on, or is marked as unverified. The
            other side of this family is at{" "}
            <a href="https://ricci-family-history.vercel.app/">
              ricci-family-history.vercel.app
            </a>
            .
          </div>
        </footer>
        </ViewerProvider>
      </body>
    </html>
  );
}

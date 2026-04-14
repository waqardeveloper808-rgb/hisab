import "./globals.css";
import Image from "next/image";
import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[linear-gradient(180deg,#f5faf6_0%,#eef5f0_45%,#f9fbf9_100%)] text-ink">
        <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-16 sm:px-8">
          <section className="w-full rounded-[2.4rem] border border-line bg-white/96 p-8 text-center shadow-[0_36px_82px_-42px_rgba(17,32,24,0.28)] backdrop-blur-xl sm:p-12">
            <Link href="/" aria-label="Return to Gulf Hisab homepage" className="inline-flex rounded-2xl">
              <Image src="/gulf-hisab-wordmark.svg" alt="Gulf Hisab" width={228} height={44} className="mx-auto h-11 w-[228px] max-w-full" />
            </Link>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Page not found</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">This page is not available.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted">
              The URL is not mapped to a live Gulf Hisab route. Use a verified destination below instead of continuing into a mixed shell state.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/" className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(31,122,83,0.45)] hover:bg-primary-hover">Go to homepage</Link>
              <Link href="/workspace/user" className="inline-flex items-center justify-center rounded-2xl border border-primary-border bg-primary-soft px-5 py-3 text-sm font-semibold text-ink hover:border-primary/40 hover:bg-white">Open user workspace</Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-2xl border border-line-strong bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-primary/30 hover:bg-primary-soft">Go to login</Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { appName } from "@/lib/brand";

export default function NotFound() {
  return (
    <section className="min-h-[calc(100vh-8rem)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f5f5_52%,#ffffff_100%)] py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl rounded-[2.2rem] border border-line bg-white/96 p-8 text-center shadow-[0_32px_72px_-40px_rgba(11,11,11,0.16)] backdrop-blur-xl sm:p-10">
          <div className="flex justify-center">
            <BrandMark className="justify-center" label={`Return to ${appName} homepage`} />
          </div>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Page not found</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">This page is not available.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted">
            The link may be outdated or the page may have moved. Use one of the verified destinations below to continue.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/" size="lg">Go to homepage</Button>
            <Button href="/workspace/user" size="lg" variant="secondary">Open user workspace</Button>
            <Button href="/login" size="lg" variant="tertiary">Go to login</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
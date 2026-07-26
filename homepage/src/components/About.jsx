export default function About() {
  return (
    <section id="about" className="bg-panel">
      <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber">About GoForMe</div>
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Built around one idea: your time is worth more than a queue.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
          GoForMe is an errand marketplace for Abuja. Instead of browsing profiles or waiting for
          someone to accept a job, every errand is matched straight to the nearest available
          runner — so the person posting spends less time coordinating, and the runner spends
          less time waiting around for work.
        </p>
      </div>
    </section>
  )
}
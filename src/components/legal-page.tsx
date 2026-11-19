import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Flower2, Sparkles } from 'lucide-react'

/** Página jurídica (Termos / Privacidade) em card elegante sobre o fundo
 *  global de sakura — mesmo idioma visual da tela de autenticação. */
export function LegalPage({
  icon: Icon,
  eyebrow,
  title,
  updatedAt,
  intro,
  sections,
  footerNote,
  prev,
  next,
}: {
  icon: React.ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  updatedAt: string
  intro: string
  sections: { title: string; body: ReactNode }[]
  footerNote?: string
  prev?: { href: string; label: string }
  next?: { href: string; label: string }
}) {
  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-[2px] py-10 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/" className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/55 backdrop-blur-md px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/40 hover:text-foreground hover:shadow-md">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Voltar ao início
          </Link>
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
            <Flower2 className="h-3 w-3 text-primary/70" />
            Tainails
          </span>
        </div>

        <article className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-card/70 shadow-2xl shadow-primary/10 backdrop-blur-xl dark:border-white/10 dark:bg-card/75">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-secondary/25 blur-3xl" />
          </div>

          <header className="relative border-b border-border/50 px-6 py-8 text-center sm:px-10 sm:py-10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-2 text-xs text-muted-foreground">Última atualização: {updatedAt}</p>
          </header>

          <div className="relative px-6 py-8 sm:px-10 sm:py-9">
            <p className="mb-8 rounded-2xl border border-border/50 bg-background/40 px-5 py-4 text-sm leading-relaxed text-foreground/90">{intro}</p>
            <div className="space-y-8">
              {sections.map((s, i) => (
                <section key={s.title}>
                  <h2 className="flex items-baseline gap-3 font-serif text-lg font-semibold text-foreground">
                    <span className="inline-flex h-6 w-6 shrink-0 translate-y-0.5 items-center justify-center rounded-full bg-primary/10 font-sans text-[11px] font-bold text-primary">{i + 1}</span>
                    {s.title}
                  </h2>
                  <p className="mt-2.5 pl-9 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </section>
              ))}
            </div>
            {footerNote ? (
              <p className="mt-9 flex items-start gap-2.5 rounded-2xl border border-accent/40 bg-accent/15 px-5 py-4 text-xs leading-relaxed text-foreground/80">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                {footerNote}
              </p>
            ) : null}
          </div>

          {(prev || next) && (
            <nav className="relative grid gap-3 border-t border-border/50 px-6 py-6 sm:grid-cols-2 sm:px-10">
              {prev ? (
                <Link href={prev.href} className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-3 transition-all hover:border-primary/40 hover:bg-primary/5">
                  <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70">Anterior</span>
                    <span className="block truncate text-sm font-medium text-foreground">{prev.label}</span>
                  </span>
                </Link>
              ) : <span aria-hidden className="hidden sm:block" />}
              {next ? (
                <Link href={next.href} className="group flex items-center justify-end gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-right transition-all hover:border-primary/40 hover:bg-primary/5">
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70">Próximo</span>
                    <span className="block truncate text-sm font-medium text-foreground">{next.label}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ) : null}
            </nav>
          )}

          <footer className="relative border-t border-border/50 px-6 py-6 sm:px-10">
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50">Desenvolvido por</p>
              <img src="/johnny-assinatura.svg" alt="Assinatura de Johnny — desenvolvedor da plataforma Tainails" className="h-10 w-auto max-w-[220px] object-contain opacity-70 transition-opacity duration-300 hover:opacity-100" />
            </div>
          </footer>
        </article>

        <p className="mt-6 text-center text-[10px] text-muted-foreground/60">© {new Date().getFullYear()} Tainails • Nails Designer</p>
      </div>
    </div>
  )
}

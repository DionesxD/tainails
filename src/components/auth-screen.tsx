'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, Mail, Lock, User, ShieldCheck, Sparkles, Calendar, Palette, Wallet, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/components/auth-provider'
import { useQueryClient } from '@tanstack/react-query'
import { hapticSuccess, hapticError, confetti } from '@/lib/feedback'
import { ThemeToggle } from '@/components/theme-toggle'

export function AuthScreen() {
  const setUser = useAuthStore((s) => s.setUser)
  const qc = useQueryClient()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)

  const [identifier, setIdentifier] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senhaCad, setSenhaCad] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, senha }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro ao entrar'); hapticError(); return }
      qc.clear()
      setUser(data.user); hapticSuccess()
      toast.success(`Bem-vinda, ${data.user.nome.split(' ')[0]}!`)
    } catch { toast.error('Erro de conexão'); hapticError() }
    finally { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone, senha: senhaCad }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro ao cadastrar'); hapticError(); return }
      qc.clear()
      setUser(data.user); hapticSuccess(); confetti({ emojis: ['💅', '✨', '💖'] })
      toast.success('Conta criada com sucesso!')
    } catch { toast.error('Erro de conexão'); hapticError() }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background/60 backdrop-blur-[2px] relative overflow-hidden">
      {/* Toggle de tema (claro/escuro) */}
      <div className="absolute top-4 right-4 z-30"><ThemeToggle /></div>
      {/* LADO ESQUERDO: HERO (desktop) — sem overflow-hidden: o brilho do
          canto superior direito atravessa a divisão e desvanece naturalmente
          em vez de ser cortado em um degrau vertical */}
      <div className="hidden md:flex md:w-1/2 relative items-center justify-center p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-primary/18 blur-3xl blob-1" />
          <div className="absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-secondary/35 blur-3xl blob-2" />
          <div className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-accent/18 blur-3xl blob-3" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center max-w-sm"
        >
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 -m-8 rounded-[3rem] bg-gradient-to-br from-primary/25 via-secondary/35 to-accent/20 blur-3xl blob-1" />
            <div className="relative rounded-[2rem] px-14 py-10 backdrop-blur-lg backdrop-saturate-150 bg-card/50 dark:bg-card/65 border border-white/50 dark:border-white/15 shadow-2xl shadow-primary/10">
              <img src="/logo.png" alt="Tainails" className="h-28 w-auto mx-auto object-contain dark:hidden" />
              <img src="/logo-dark.png" alt="Tainails" className="hidden dark:block h-28 w-auto mx-auto object-contain" />
              <h1 className="text-4xl font-serif font-bold text-foreground mt-3">Tainails</h1>
              <p className="text-sm text-primary tracking-[0.3em] uppercase mt-1">• Nails Designer •</p>
            </div>
          </div>

          <h2 className="text-3xl font-serif font-bold tracking-tight mb-3 text-foreground">
            Realce sua beleza com <span className="text-primary">cuidado e exclusividade</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            Agende online, experimente cores no provador virtual e acompanhe seus atendimentos — tudo em um só lugar.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Calendar, label: 'Agende\nonline' },
              { icon: Palette, label: 'Provador\nde cores' },
              { icon: Wallet, label: 'Histórico\ncompleto' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card/45 backdrop-blur-[6px] border border-white/40 dark:border-white/10"
              >
                <f.icon className="h-6 w-6 text-primary" />
                <span className="text-xs text-muted-foreground whitespace-pre-line text-center leading-tight">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Transição suave entre o hero e o formulário (desktop) — véu integral
          (100% da altura), largo e com transparência progressiva em camadas:
          começa transparente no fim do hero e desaparece dentro do form,
          sem faixa sólida, linha vertical ou halo central */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 z-[5] hidden w-[26rem] -translate-x-1/2 md:block"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 dark:via-background/15 to-transparent blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/9 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-l from-secondary/7 via-secondary/5 to-transparent blur-3xl" />
      </div>

      {/* LADO DIREITO: FORM */}
      <div className="flex-1 md:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 md:hidden overflow-hidden">
          <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl blob-1" />
          <div className="absolute top-1/3 -left-24 h-64 w-64 rounded-full bg-secondary/30 blur-3xl blob-2" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Logo mobile */}
          <div className="text-center mb-6 md:hidden">
            <div className="relative inline-block mb-3">
              <div className="absolute inset-0 -m-6 rounded-[2.5rem] bg-gradient-to-br from-primary/25 via-secondary/35 to-accent/20 blur-2xl blob-1" />
              <div className="relative rounded-[1.5rem] px-8 py-5 backdrop-blur-lg backdrop-saturate-150 bg-card/55 dark:bg-card/70 border border-white/50 dark:border-white/15 shadow-xl">
                <img src="/logo.png" alt="Tainails" className="h-20 w-auto mx-auto object-contain dark:hidden" />
                <img src="/logo-dark.png" alt="Tainails" className="hidden dark:block h-20 w-auto mx-auto object-contain" />
                <h1 className="text-2xl font-serif font-bold text-foreground mt-2">Tainails</h1>
                <p className="text-xs text-primary tracking-[0.3em] uppercase mt-1">• Nails Designer •</p>
              </div>
            </div>
          </div>

          <Card className="glass glass-highlight shadow-2xl shadow-primary/5">
            <CardContent className="pt-6">
              <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Criar conta</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="id">E-mail ou telefone</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="ana@exemplo.com" className="pl-9" autoComplete="username" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="senha">Senha</Label>
                        <button type="button" onClick={() => toast.info('Peça à manicure para redefinir sua senha com segurança.')} className="text-xs text-primary hover:underline flex items-center gap-1 press">
                          <KeyRound className="h-3 w-3" /> Esqueceu?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••" className="pl-9" autoComplete="current-password" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={loading}>
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Seus dados estão seguros.</span>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-cad">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email-cad" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tel-cad">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="tel-cad" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senha-cad">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="senha-cad" type="password" value={senhaCad} onChange={(e) => setSenhaCad(e.target.value)} placeholder="Mínimo 8 caracteres" className="pl-9" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={loading}>
                      {loading ? 'Criando...' : 'Criar conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-5 flex items-center justify-center gap-5 text-[11px] text-muted-foreground md:hidden">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> Agende</span>
            <span className="h-3 w-px bg-border" />
            <span className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5 text-primary" /> Provador</span>
            <span className="h-3 w-px bg-border" />
            <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-primary" /> Histórico</span>
          </div>

        </motion.div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-4 text-center">
        <p className="text-[10px] text-muted-foreground/60">© {new Date().getFullYear()} Tainails • Nails Designer</p>
        <div className="mt-1 flex items-center justify-center gap-3 text-[10px]">
          <a href="/termos" className="text-muted-foreground/60 hover:text-primary transition-colors">Termos</a>
          <span className="h-2 w-px bg-border" />
          <a href="/privacidade" className="text-muted-foreground/60 hover:text-primary transition-colors">Privacidade</a>
        </div>
      </footer>
    </div>
  )
}

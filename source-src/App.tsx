import { useEffect, useMemo, useRef, useState } from "react"
import CellScene from "./CellScene"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Droplet, Home, FileText, Search, Clock, MapPin, Phone, Copy, Check, MessageCircle,
  ShieldCheck, Baby, HeartPulse, Activity, Navigation, CalendarClock, FlaskConical, Menu, X,
} from "lucide-react"

const PHONE_DISPLAY = "011 2729 8983"
const WA = "https://wa.me/201127298983"
const MAPS = "https://maps.app.goo.gl/bhFfFZmbenR7mw736"
const waLink = (text: string) => `${WA}?text=${encodeURIComponent(text)}`

/* ---------- Logo (redesigned mark) ---------- */
function Mark({ className = "", animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="شعار معمل ترولايف">
      <circle cx="100" cy="100" r="96" fill="#1F2A7A" />
      <circle cx="100" cy="100" r="80" fill="#FFFFFF" />
      <path d="M78 146 A50 50 0 0 1 92 70" fill="none" stroke="#1F2A7A" strokeWidth="13" strokeLinecap="round" />
      <rect x="92" y="34" width="34" height="12" rx="4" fill="#1F2A7A" />
      <rect x="98" y="46" width="22" height="56" rx="3" fill="#1F2A7A" />
      <rect x="98" y="66" width="22" height="4" fill="#FFFFFF" />
      <rect x="103" y="102" width="12" height="12" rx="2" fill="#1F2A7A" />
      <path className={animate ? "drip" : ""} d="M109 117 C109 117 99 129 99 135.5 a10 10 0 0 0 20 0 C119 129 109 117 109 117Z" fill="#D7263D" />
      <rect x="62" y="150" width="80" height="11" rx="5.5" fill="#1F2A7A" />
    </svg>
  )
}

/* ---------- Open-now status (11:00 → 23:00 Cairo) ---------- */
function useOpenStatus() {
  const calc = () => {
    const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Cairo" }).format(new Date()))
    return h >= 11 && h < 23
  }
  const [open, setOpen] = useState(calc)
  useEffect(() => { const t = setInterval(() => setOpen(calc()), 60000); return () => clearInterval(t) }, [])
  return open
}

/* ---------- Data ---------- */
type Cat = "all" | "blood" | "hormone" | "other"
const TESTS: { n: string; e: string; c: Exclude<Cat, "all">; fast: boolean; prep: string; note?: string }[] = [
  { n: "صورة دم كاملة", e: "CBC", c: "blood", fast: false, prep: "لا يحتاج صيام", note: "ممكن في أي وقت" },
  { n: "سكر صائم", e: "FBS", c: "blood", fast: true, prep: "صيام 8 إلى 12 ساعة", note: "المية مسموحة" },
  { n: "سكر تراكمي", e: "HbA1c", c: "blood", fast: false, prep: "لا يحتاج صيام", note: "بيقيس متوسط آخر 3 شهور" },
  { n: "دهون الدم", e: "Lipid Profile", c: "blood", fast: true, prep: "صيام 9 إلى 12 ساعة", note: "بلاش أكل دسم الليلة اللي قبلها" },
  { n: "وظائف كبد", e: "ALT / AST", c: "blood", fast: false, prep: "لا يحتاج صيام غالبًا", note: "بلّغ الفني بالأدوية اللي بتاخدها" },
  { n: "وظائف كلى", e: "Creatinine / Urea", c: "blood", fast: false, prep: "لا يحتاج صيام" },
  { n: "حمض اليوريك", e: "Uric Acid", c: "blood", fast: false, prep: "يفضل صيام 4 ساعات" },
  { n: "فيتامين د", e: "Vitamin D", c: "blood", fast: false, prep: "لا يحتاج صيام" },
  { n: "مخزون الحديد", e: "Ferritin", c: "blood", fast: false, prep: "لا يحتاج صيام" },
  { n: "الغدة الدرقية", e: "TSH / FT4", c: "hormone", fast: false, prep: "لا يحتاج صيام", note: "يفضل الصبح قبل دوا الغدة" },
  { n: "تحليل حمل في الدم", e: "β-hCG", c: "hormone", fast: false, prep: "لا يحتاج صيام" },
  { n: "هرمون الحليب", e: "Prolactin", c: "hormone", fast: false, prep: "راحة 30 دقيقة قبل السحب", note: "يفضل الصبح" },
  { n: "تحليل بول كامل", e: "Urine Analysis", c: "other", fast: false, prep: "أول عينة الصبح أفضل", note: "من منتصف التبول" },
  { n: "تحليل براز", e: "Stool Analysis", c: "other", fast: false, prep: "عينة طازجة في علبة نظيفة", note: "العلبة من المعمل" },
]
const CATS: { id: Cat; label: string }[] = [
  { id: "all", label: "الكل" }, { id: "blood", label: "دم" }, { id: "hormone", label: "هرمونات" }, { id: "other", label: "بول وبراز" },
]
const PACKS = [
  { icon: Activity, name: "باقة السكر", items: ["سكر صائم وفاطر", "سكر تراكمي HbA1c", "وظائف كلى"], fast: true },
  { icon: HeartPulse, name: "باقة الاطمئنان الشاملة", items: ["صورة دم كاملة CBC", "وظائف كبد وكلى", "دهون وسكر", "غدة درقية TSH", "فيتامين د"], fast: true, featured: true },
  { icon: Baby, name: "باقة متابعة الحمل", items: ["صورة دم كاملة", "فصيلة الدم", "سكر صائم", "تحليل بول"], fast: true },
]

/* ---------- Small pieces ---------- */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-display text-sm font-semibold text-drop mb-1">{children}</p>
}
function WaButton({ text, children, variant = "solid", className = "" }: { text: string; children: React.ReactNode; variant?: "solid" | "outline" | "light"; className?: string }) {
  const styles = {
    solid: "bg-drop text-white hover:brightness-95",
    outline: "bg-transparent text-band-fg ring-1 ring-inset ring-band-muted/70 hover:bg-white/10",
    light: "bg-primary text-primary-foreground hover:brightness-110",
  }[variant]
  return (
    <a href={waLink(text)} target="_blank" rel="noopener"
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 font-display font-semibold transition-[filter,background-color] duration-200 cursor-pointer ${styles} ${className}`}>
      {children}
    </a>
  )
}

/* ---------- Header ---------- */
function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => { const f = () => setScrolled(window.scrollY > 8); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f) }, [])
  const links = [["#tests", "دليل التحاليل"], ["#packages", "الباقات"], ["#book", "احجز"], ["#visit", "العنوان"]]
  return (
    <header className={`sticky z-40 bg-white/85 backdrop-blur-md transition-shadow duration-300 ${scrolled ? "shadow-[0_8px_30px_-12px_hsl(233_60%_30%/.25)]" : ""}`} style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <div className="gutter mx-auto flex max-w-6xl items-center justify-between gap-4 py-3">
        <a href="#top" className="flex items-center gap-3 no-underline">
          <Mark className="h-11 w-11 shrink-0" />
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold text-primary">معمل ترولايف</span>
            <span className="ltr block font-display text-[11px] tracking-[.2em] text-muted-foreground">TRUE LIFE LAB</span>
          </span>
        </a>
        <nav aria-label="أقسام الموقع" className="hidden items-center gap-7 md:flex">
          {links.map(([h, l]) => <a key={h} href={h} className="relative text-[15px] text-muted-foreground transition-colors hover:text-primary after:absolute after:-bottom-1 after:right-0 after:h-0.5 after:w-0 after:bg-drop after:transition-all after:duration-300 hover:after:w-full">{l}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <WaButton text="مساء الخير، عايز أحجز تحليل" className="btn-sheen hidden sm:inline-flex !min-h-[44px] !px-5 text-[15px]">
            <MessageCircle className="h-4 w-4" aria-hidden /> احجز على الواتساب
          </WaButton>
          <button aria-label={open ? "اقفل القايمة" : "افتح القايمة"} aria-expanded={open} onClick={() => setOpen(!open)}
            className="grid h-11 w-11 place-items-center rounded-full border text-primary md:hidden cursor-pointer">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="القايمة" className="gutter border-t pb-4 md:hidden">
          {links.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block py-3 font-display text-primary">{l}</a>)}
        </nav>
      )}
    </header>
  )
}

/* ---------- Hero ---------- */
function Hero() {
  const open = useOpenStatus()
  return (
    <section id="top" className="relative overflow-hidden bg-white">
      <div aria-hidden className="dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_40%,#000_20%,transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,hsl(352_90%_60%/.12),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,hsl(233_70%_55%/.10),transparent_65%)]" />
      <div className="gutter relative mx-auto grid max-w-6xl items-center gap-4 pb-12 pt-4 md:grid-cols-[1.1fr_1fr] md:gap-8 md:py-16">
        <div className="hero-in order-2 min-w-0 md:order-1">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${open ? "bg-emerald-500 pulse-dot" : "bg-muted-foreground/50"}`} aria-hidden />
            <span><b className="font-semibold text-foreground">{open ? "مفتوح دلوقتي" : "مقفول دلوقتي"}</b> · من 11 الصبح لـ 11 بالليل</span>
          </div>
          <h1 className="text-[36px] font-bold text-primary sm:text-5xl md:text-[58px]">
            نتيجة دقيقة <span className="shine">تطمّنك</span>،<br className="hidden sm:block" /> وتوصلك لحد عندك
          </h1>
          <p className="mt-5 max-w-[34em] text-lg text-muted-foreground">
            معمل تحاليل طبية في بولاق الدكرور جنب فيصل. اسحب العينة في المعمل أو من بيتك، والنتيجة توصلك على الواتساب.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <WaButton text="عايز أحجز سحب منزلي" className="btn-sheen shadow-lg shadow-drop/25">
              <Home className="h-5 w-5" aria-hidden /> اطلب سحب منزلي
            </WaButton>
            <a href="#tests" className="inline-flex min-h-[48px] items-center gap-2 rounded-full border bg-white px-6 font-display font-semibold text-primary transition-colors duration-200 hover:bg-secondary">
              <Search className="h-5 w-5" aria-hidden /> اعرف تحضير تحليلك
            </a>
          </div>
        </div>

        <div className="relative order-1 h-[320px] sm:h-[400px] md:order-2 md:h-[520px]">
          <CellScene className="absolute -inset-x-6 inset-y-0 [mask-image:radial-gradient(ellipse_at_center,#000_58%,transparent_78%)]" />
          <div className="float-a pointer-events-none absolute right-0 top-6 flex items-center gap-2 rounded-2xl border bg-white/90 px-3.5 py-2.5 text-sm shadow-xl shadow-primary/10 backdrop-blur md:right-2">
            <Droplet className="h-4 w-4 text-drop" aria-hidden /> أدوات سحب استخدام مرة واحدة
          </div>
          <div className="float-b pointer-events-none absolute bottom-6 left-0 flex items-center gap-2 rounded-2xl border bg-white/90 px-3.5 py-2.5 text-sm shadow-xl shadow-primary/10 backdrop-blur md:left-2">
            <FileText className="h-4 w-4 text-primary" aria-hidden /> النتيجة PDF على الواتساب
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Test marquee ---------- */
function Marquee() {
  const names = ["صورة دم كاملة CBC", "سكر تراكمي HbA1c", "وظائف كبد", "وظائف كلى", "دهون الدم", "فيتامين د", "الغدة الدرقية TSH", "مخزون الحديد", "تحليل حمل", "تحليل بول", "حمض اليوريك", "هرمون الحليب"]
  const row = [...names, ...names]
  return (
    <div className="marquee overflow-hidden border-y bg-secondary/60 py-4" aria-label="بعض التحاليل المتاحة">
      <div className="marquee-track" dir="ltr">
        {row.map((n, i) => (
          <span key={i} dir="rtl" aria-hidden={i >= names.length} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-1.5 font-display text-sm text-primary shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-drop" aria-hidden />{n}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- Tilt + reveal helpers ---------- */
function Tilt({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const fine = typeof window !== "undefined" && matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches
  const move = (e: React.PointerEvent) => {
    if (!fine || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-4px)`
  }
  const leave = () => { if (ref.current) ref.current.style.transform = "" }
  return <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={`tilt ${className}`}>{children}</div>
}
function useReveal() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target) } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
    els.forEach(el => { if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("pre"); io.observe(el) } })
    return () => io.disconnect()
  }, [])
}

/* ---------- Services strip ---------- */
function Services() {
  const items = [
    { icon: FlaskConical, t: "تحاليل الدم الروتينية", d: "صورة دم، سكر، وظائف كبد وكلى، دهون، وغدة درقية." },
    { icon: Home, t: "سحب عينات من البيت", d: "لكبار السن والحوامل والأطفال، في الميعاد اللي يناسبك." },
    { icon: FileText, t: "نتيجتك على موبايلك", d: "بنبعتلك النتيجة على الواتساب أول ما تجهز، وورقي لو حبيت." },
    { icon: Clock, t: "مفتوح 12 ساعة", d: "من 11 الصبح لحد 11 بالليل، فتلحق بعد شغلك." },
  ]
  return (
    <section className="gutter mx-auto max-w-6xl py-14 md:py-20">
      <Eyebrow>خدماتنا</Eyebrow>
      <h2 className="mb-8 text-[26px] font-bold md:text-[34px]">كل اللي محتاجه في زيارة واحدة</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: I, t, d }, i) => (
          <div key={t} data-reveal style={{ ["--d" as string]: `${i * 80}ms` }}>
            <Tilt className="flex h-full flex-col gap-2 rounded-2xl border bg-card p-6">
              <span className="pop mb-1 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-[hsl(233_60%_42%)] text-white shadow-lg shadow-primary/25"><I className="h-5 w-5" aria-hidden /></span>
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="text-[15px] text-muted-foreground">{d}</p>
            </Tilt>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Tests guide ---------- */
function Tests() {
  const [q, setQ] = useState("")
  const [cat, setCat] = useState<Cat>("all")
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return TESTS.filter(t => (cat === "all" || t.c === cat) && (!s || `${t.n} ${t.e}`.toLowerCase().includes(s)))
  }, [q, cat])
  return (
    <section id="tests" className="gutter mx-auto max-w-6xl scroll-mt-24 pb-16 md:pb-24">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <Eyebrow>دليل التحاليل</Eyebrow>
          <h2 className="text-[26px] font-bold md:text-[34px]">محتاج تصوم ولا لأ؟</h2>
          <p className="mt-2 text-muted-foreground">ابحث عن التحليل واعرف تحضيره قبل ما تيجي. لو دكتورك قالك تعليمات مختلفة، امشي على كلامه.</p>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-drop" aria-hidden />محتاج صيام</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />من غير صيام</span>
        </div>
      </div>

      <div data-reveal className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative min-w-0 flex-[1_1_240px]">
            <label htmlFor="test-search" className="sr-only">ابحث عن تحليل</label>
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="test-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث: سكر، كبد، CBC…" className="h-12 rounded-xl bg-background pr-10 text-base" />
          </div>
          <div role="group" aria-label="تصنيف التحاليل" className="flex flex-wrap gap-2">
            {CATS.map(c => (
              <button key={c.id} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}
                className={`min-h-[44px] rounded-full border px-4 text-sm transition-colors duration-200 cursor-pointer ${cat === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-accent"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="divide-y" aria-live="polite">
          {list.map(t => (
            <li key={t.e} className="grid gap-1.5 px-5 py-4 sm:grid-cols-[1.2fr_1fr_1.2fr] sm:items-center sm:gap-4">
              <div className="min-w-0">
                <span className="font-semibold">{t.n}</span>
                <span className="ltr ms-2 text-[13px] text-muted-foreground">{t.e}</span>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${t.fast ? "bg-drop-soft text-drop" : "bg-secondary text-secondary-foreground"}`}>
                  {t.fast ? <Clock className="h-3.5 w-3.5" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
                  {t.prep}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{t.note ?? ""}</p>
            </li>
          ))}
        </ul>
        {list.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center text-muted-foreground">
            <p>التحليل ده مش في القايمة، بس غالبًا بنعمله. ابعتلنا اسمه ونقولك تحضيره.</p>
            <WaButton variant="light" text={`عايز أسأل عن تحليل: ${q}`}><MessageCircle className="h-4 w-4" aria-hidden /> اسأل على الواتساب</WaButton>
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------- Packages ---------- */
function Packages() {
  return (
    <section id="packages" className="dots scroll-mt-24 border-y bg-white">
      <div className="gutter mx-auto max-w-6xl py-16 md:py-24">
        <Eyebrow>باقات الفحص</Eyebrow>
        <h2 className="mb-2 text-[26px] font-bold md:text-[34px]">باقات جاهزة بدل ما تختار تحليل تحليل</h2>
        <p className="mb-8 text-muted-foreground">ابعتلنا اسم الباقة على الواتساب ونقولك سعرها وتحضيرها.</p>
        <div className="grid gap-5 md:grid-cols-3">
          {PACKS.map((p, i) => (
            <div key={p.name} data-reveal style={{ ["--d" as string]: `${i * 100}ms` }}>
            <Tilt className={`relative flex h-full flex-col gap-4 rounded-2xl border p-6 ${p.featured ? "border-primary bg-secondary/60 ring-1 ring-primary" : "bg-white"}`}>
              {p.featured && <span className="absolute -top-3 right-6 rounded-full bg-drop px-3 py-0.5 font-display text-xs font-semibold text-white">الأشمل للفحص الدوري</span>}
              <div className="flex items-center gap-3">
                <span className="pop grid h-11 w-11 place-items-center rounded-xl bg-white text-primary shadow-md ring-1 ring-border"><p.icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="text-xl font-semibold">{p.name}</h3>
              </div>
              <ul className="flex-1 space-y-2 text-[15px]">
                {p.items.map(i => <li key={i} className="flex items-start gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />{i}</li>)}
              </ul>
              {p.fast && <p className="flex items-center gap-1.5 text-[13px] text-drop"><Clock className="h-3.5 w-3.5" aria-hidden /> محتاجة صيام 9 إلى 12 ساعة</p>}
              <WaButton variant="light" text={`عايز أعرف سعر ${p.name}`} className="pop w-full">اسأل عن السعر</WaButton>
            </Tilt>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Booking (home visit) ---------- */
function Booking() {
  const [name, setName] = useState("")
  const [area, setArea] = useState("")
  const [tests, setTests] = useState("")
  const [where, setWhere] = useState<"home" | "lab">("home")
  const [time, setTime] = useState("الصبح")
  const msg = [
    "السلام عليكم، عايز أحجز في معمل ترولايف.",
    `الاسم: ${name || "—"}`,
    `النوع: ${where === "home" ? "سحب منزلي" : "هاجي المعمل"}`,
    where === "home" ? `المنطقة: ${area || "—"}` : "",
    `التحاليل: ${tests || "—"}`,
    `الميعاد المناسب: ${time}`,
  ].filter(Boolean).join("\n")
  const steps = [
    { icon: MessageCircle, t: "ابعتلنا التحاليل", d: "اكتبها أو صوّر الروشتة." },
    { icon: CalendarClock, t: "نأكد الميعاد", d: "ونقولك تعليمات الصيام لو محتاج." },
    { icon: ShieldCheck, t: "نسحب العينة", d: "بأدوات معقمة واستخدام مرة واحدة." },
    { icon: FileText, t: "النتيجة توصلك", d: "على الواتساب، وورقي لو حبيت." },
  ]
  const seg = (on: boolean) => `min-h-[44px] flex-1 rounded-lg px-3 text-sm font-medium transition-colors duration-200 cursor-pointer ${on ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`
  return (
    <section id="book" className="gutter mx-auto max-w-6xl scroll-mt-24 py-16 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Eyebrow>الحجز والسحب المنزلي</Eyebrow>
          <h2 className="text-[26px] font-bold md:text-[34px]">من غير ما تنزل من البيت</h2>
          <p className="mt-2 text-muted-foreground">املا البيانات وهتتفتح محادثة واتساب مع المعمل والرسالة جاهزة. مفيش حاجة بتتبعت غير لما تدوس إرسال بنفسك.</p>
          <ol className="mt-8 space-y-5">
            {steps.map((s, i) => (
              <li key={s.t} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }} className="flex gap-4">
                <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                  <s.icon className="h-5 w-5" aria-hidden />
                  <span className="tnum absolute -top-1 -left-1 grid h-5 w-5 place-items-center rounded-full bg-drop text-[11px] font-bold text-white">{i + 1}</span>
                </span>
                <div><h3 className="font-semibold">{s.t}</h3><p className="text-[15px] text-muted-foreground">{s.d}</p></div>
              </li>
            ))}
          </ol>
        </div>

        <form data-reveal onSubmit={e => e.preventDefault()} className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-[0_30px_60px_-30px_hsl(233_60%_30%/.3)] md:p-8" aria-labelledby="book-title">
          <h3 id="book-title" className="text-xl font-semibold">احجز ميعادك</h3>
          <div role="group" aria-label="مكان السحب" className="flex gap-1 rounded-xl bg-muted p-1">
            <button type="button" aria-pressed={where === "home"} className={seg(where === "home")} onClick={() => setWhere("home")}>سحب منزلي</button>
            <button type="button" aria-pressed={where === "lab"} className={seg(where === "lab")} onClick={() => setWhere("lab")}>هاجي المعمل</button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="b-name">الاسم</label>
              <Input id="b-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="h-12 text-base" placeholder="مثال: أحمد محمد" />
            </div>
            {where === "home" && (
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="b-area">المنطقة</label>
                <Input id="b-area" value={area} onChange={e => setArea(e.target.value)} className="h-12 text-base" placeholder="مثال: فيصل، الطالبية" />
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="b-tests">التحاليل المطلوبة</label>
            <Textarea id="b-tests" rows={3} value={tests} onChange={e => setTests(e.target.value)} className="text-base" placeholder="مثال: صورة دم وسكر تراكمي" />
            <p className="text-[13px] text-muted-foreground">لو معاك روشتة، ابعت صورتها في نفس المحادثة.</p>
          </div>
          <div className="grid gap-2">
            <span id="b-time-l" className="text-sm font-medium">الميعاد المناسب</span>
            <div role="group" aria-labelledby="b-time-l" className="flex gap-1 rounded-xl bg-muted p-1">
              {["الصبح", "بعد الضهر", "بالليل"].map(t => <button key={t} type="button" aria-pressed={time === t} className={seg(time === t)} onClick={() => setTime(t)}>{t}</button>)}
            </div>
          </div>
          <a href={waLink(msg)} target="_blank" rel="noopener"
            className="mt-1 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-wa px-6 font-display font-semibold text-white transition-[filter] duration-200 hover:brightness-95 cursor-pointer">
            <MessageCircle className="h-5 w-5" aria-hidden /> كمّل الحجز على الواتساب
          </a>
        </form>
      </div>
    </section>
  )
}

/* ---------- FAQ ---------- */
function FAQ() {
  const qa = [
    ["أقدر أشرب مية وأنا صايم للتحليل؟", "أيوه، المية العادية مسموحة. الممنوع الأكل والعصير والشاي والقهوة والسجاير لحد ما تسحب العينة."],
    ["آخد أدويتي قبل التحليل؟", "أغلب الأدوية عادي، بس بعض التحاليل زي الغدة الدرقية بيفضل تسحب قبل الدوا. قول للفني على أدويتك وهو يقولك."],
    ["محتاج روشتة عشان أعمل تحليل؟", "ابعتلنا على الواتساب التحاليل اللي عايزها، ولو معاك روشتة ابعت صورتها ونراجعها معاك."],
    ["بتسحبوا من الأطفال؟", "أيوه. ولو الطفل صغير، السحب المنزلي بيكون أريح ليه."],
  ]
  return (
    <section className="border-t bg-secondary/40">
      <div className="gutter mx-auto grid max-w-6xl gap-8 py-16 md:grid-cols-[1fr_1.6fr] md:py-20">
        <div><Eyebrow>أسئلة بتتكرر</Eyebrow><h2 className="text-[26px] font-bold md:text-[34px]">قبل ما تيجي</h2></div>
        <div data-reveal className="divide-y border-y">
          {qa.map(([q, a], i) => (
            <details key={i} className="group py-1">
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-lg text-secondary-foreground transition-transform duration-200 group-open:rotate-45">+</span>
              </summary>
              <p className="pb-4 text-[15px] leading-7 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Visit ---------- */
function Visit() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText("01127298983"); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { const el = document.getElementById("phone-num"); if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r) } }
  }
  return (
    <section id="visit" className="gutter mx-auto max-w-6xl scroll-mt-24 py-16 md:py-24">
      <Eyebrow>زورنا</Eyebrow>
      <h2 className="mb-8 text-[26px] font-bold md:text-[34px]">المعمل في بولاق الدكرور، الجيزة</h2>
      <div className="grid gap-5 md:grid-cols-2">
        <div data-reveal className="min-w-0 rounded-2xl border bg-card p-6 md:p-8">
          <dl className="grid gap-6">
            <div className="flex gap-4">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-drop" aria-hidden />
              <div><dt className="text-sm text-muted-foreground">العنوان</dt><dd className="font-medium">شارع حامد السيد، كفر طهرمس، بولاق الدكرور، الجيزة. جنب محلات الحوت للمحمول.</dd>
                <dd className="mt-1 text-sm text-muted-foreground">كود جوجل: <span className="ltr font-display">256G+PCQ Giza</span></dd></div>
            </div>
            <div className="flex gap-4">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-drop" aria-hidden />
              <div><dt className="text-sm text-muted-foreground">مواعيد العمل</dt><dd className="font-medium">من 11 صباحًا إلى 11 مساءً</dd></div>
            </div>
            <div className="flex gap-4">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-drop" aria-hidden />
              <div className="min-w-0 flex-1"><dt className="text-sm text-muted-foreground">الحجز والواتساب</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-3">
                  <span id="phone-num" className="ltr tnum select-all font-display text-2xl font-semibold">{PHONE_DISPLAY}</span>
                  <button onClick={copy} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm transition-colors duration-200 hover:bg-accent cursor-pointer">
                    {copied ? <Check className="h-4 w-4 text-wa" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                    <span aria-live="polite">{copied ? "اتنسخ" : "انسخ الرقم"}</span>
                  </button>
                </dd></div>
            </div>
          </dl>
        </div>

        <a data-reveal style={{ ["--d" as string]: "120ms" }} href={MAPS} target="_blank" rel="noopener" className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl border bg-secondary p-5">
          <svg aria-hidden viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
            <g stroke="hsl(var(--border))" strokeWidth="16" fill="none" strokeLinecap="round">
              <path d="M-10 80 L410 120" /><path d="M-10 210 L410 185" /><path d="M120 -10 L150 290" /><path d="M300 -10 L268 290" />
            </g>
            <g stroke="hsl(var(--card))" strokeWidth="5" fill="none"><path d="M-10 80 L410 120" /><path d="M120 -10 L150 290" /></g>
            <circle cx="215" cy="128" r="30" fill="hsl(var(--drop))" opacity=".16" />
            <path className="drip" d="M215 98 C215 98 199 118 199 128 a16 16 0 0 0 32 0 C231 118 215 98 215 98Z" fill="hsl(var(--drop))" />
          </svg>
          <span className="relative flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 font-display font-semibold shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
            افتح الموقع على خرائط جوجل <Navigation className="h-5 w-5 text-drop" aria-hidden />
          </span>
        </a>
      </div>
    </section>
  )
}

/* ---------- Mobile action bar ---------- */
function MobileBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))", paddingTop: 10, paddingLeft: "max(16px, env(safe-area-inset-left, 0px))", paddingRight: "max(16px, env(safe-area-inset-right, 0px))" }}>
      <div className="flex gap-2">
        <a href={waLink("السلام عليكم، عايز أحجز تحليل")} target="_blank" rel="noopener" className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-wa font-display font-semibold text-white">
          <MessageCircle className="h-5 w-5" aria-hidden /> واتساب
        </a>
        <a href={MAPS} target="_blank" rel="noopener" className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border font-display font-semibold">
          <Navigation className="h-5 w-5 text-drop" aria-hidden /> الاتجاهات
        </a>
      </div>
    </div>
  )
}

export default function App() {
  useReveal()
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">انتقل للمحتوى</a>
      <Header />
      <main id="main" className="pb-24 md:pb-0">
        <Hero />
        <Marquee />
        <Services />
        <Tests />
        <Packages />
        <Booking />
        <FAQ />
        <Visit />
      </main>
      <footer className="bg-band pb-24 text-band-muted md:pb-0">
        <div className="gutter mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 py-6 text-sm">
          <span className="flex items-center gap-2"><Mark className="h-7 w-7" /> © 2026 معمل ترولايف للتحاليل الطبية</span>
          <span>نموذج مبدئي · تصميم وتطوير MedFrame Studio</span>
        </div>
      </footer>
      <MobileBar />
    </>
  )
}

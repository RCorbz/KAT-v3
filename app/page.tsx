import { db } from "@/db"
import { eq } from "drizzle-orm"
import { clinics, reviews as reviewsSchema } from "@/db/schema"
import { ReviewTicker } from "@/components/ReviewTicker"
import { HeroCarousel } from "@/components/HeroCarousel"
import { ClientCTAs } from "@/components/LandingPageClient"
import Link from "next/link"
import { Phone, MapPin, Coffee, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // 1. Fetch Headquarters Clinic for wait time and doctor info
  const clinic = await db.query.clinics.findFirst({
    where: eq(clinics.slug, "weatherford-tx")
  })

  // 2. Fetch Featured Reviews for the ticker
  let featuredReviews = await db.select({
    id: reviewsSchema.id,
    reviewerName: reviewsSchema.reviewerName,
    rating: reviewsSchema.rating,
    feedbackText: reviewsSchema.feedbackText
  }).from(reviewsSchema).where(eq(reviewsSchema.isFeatured, true))

  // Fallback reviews if none are featured or existing
  if (featuredReviews.length === 0) {
    featuredReviews = [
      { id: "f1", reviewerName: "John D.", rating: 5, feedbackText: "Fastest physical I've ever had. In and out in 15 mins!" },
      { id: "f2", reviewerName: "Sarah M.", rating: 5, feedbackText: "Dr. Ben is the best. Very professional and driver-friendly." },
      { id: "f3", reviewerName: "Mike T.", rating: 5, feedbackText: "Great amenities while waiting. Clean clinic and easy parking." }
    ]
  }

  if (!clinic) {
    return <div className="p-8 text-center bg-zinc-950 text-white min-h-screen">Loading Clinic Data...</div>
  }

  const waitTime = clinic.estimatedWaitMinutes || 0
  const waitTimeText = waitTime === 0 ? "0 MIN" : `${waitTime} MIN`
  const waitTimeSubtext = waitTime === 0 ? "LOW WAIT" : "EST. WAIT"
  const waitColor = waitTime < 15 ? "text-emerald-400" : waitTime < 45 ? "text-amber-400" : "text-red-400"
  const waitBorder = waitTime < 15 ? "border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : waitTime < 45 ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30 bg-red-500/5"

  const walkInPrice = clinic.walkInPrice || "125.00"
  const reservedPrice = clinic.reservedPrice || "99.00"

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30">
      {/* BRANDING HEADER */}
      <header className="pt-6 pb-2 px-6 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">Est. 2024</span>
          <h1 className="text-xl font-black italic tracking-tighter text-white uppercase">KEEP AMERICA <span className="text-blue-500">TRUCKING</span></h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-between w-full max-w-md mx-auto px-4 py-4 overflow-hidden">

        {/* HERO CAROUSEL */}
        <div className="relative flex-shrink-0">
          {/* <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10"></div> */}
          <HeroCarousel
            doctorName={clinic.doctorName}
            doctorBio={clinic.doctorBio}
            doctorPicUrl={clinic.doctorPicUrl}
          />
        </div>

        {/* CHOICE PATHS */}
        <div className="space-y-4">
          {/* OPTION 1: WALK-IN (FULL PRICE) */}
          <div className={`relative p-5 rounded-2xl border backdrop-blur-md transition-all active:scale-[0.98] ${waitBorder}`}>
            <div className="absolute -top-3 right-4 z-10">
              <span className="bg-emerald-500 text-zinc-950 text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded-full shadow-lg">Fast Track</span>
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-black text-white italic">1. WALK-IN ANYTIME</h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-[200px]">Show up, fill the form, say 'Yes Sir', get your card in ~30 mins.</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">${parseInt(walkInPrice)}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Full Price</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className={`text-2xl font-black tracking-tighter ${waitColor}`}>{waitTimeText}</div>
                <div className={`text-[8px] font-bold tracking-widest uppercase ${waitColor} opacity-80`}>{waitTimeSubtext}</div>
              </div>
              <div className="flex-1">
                <LandingCTAs type="walkin" clinicId={clinic.id} doctorName={clinic.doctorName} />
              </div>
            </div>
          </div>

          {/* OPTION 2: SCHEDULE (DISCOUNT) */}
          <div className="relative p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md transition-all active:scale-[0.98]">
            <div className="absolute -top-3 right-4 z-10">
              <span className="bg-blue-600 text-white text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded-full shadow-lg">Save $26</span>
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-black text-white italic tracking-tight">2. CLICK & SAVE</h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-[200px]">Fill form online, pick a slot, say 'Yes Sir', get card in 15 mins.</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-blue-400">${parseInt(reservedPrice)}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Reserved</div>
              </div>
            </div>

            <div className="w-full">
              <Link href="/get-my-card">
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black italic rounded-xl h-12 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                  15 MINUTE PHYSICAL PLEASE.
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* DOCTOR CENTERPIECE REMOVED - NOW IN CAROUSEL */}

        {/* REVIEW TICKER */}
        <div className="w-full -mx-4 overflow-hidden mt-4">
          <ReviewTicker reviews={featuredReviews} />
        </div>

        {/* FMCSA BADGE */}
        <div className="flex justify-center pt-2">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-full px-3 py-1 flex items-center gap-2 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[8px] font-bold tracking-widest text-zinc-300 uppercase">FMCSA National Registry Certified</span>
          </div>
        </div>
      </main>

      {/* OVERFLOW AREA (Available on scroll if user forces) */}
      <div className="flex-shrink-0 h-[20vh] bg-zinc-950 flex flex-col items-center justify-center -mt-px">
        {/* Directions/Amenities can live here or just whitespace to ensure no bounce */}
      </div>
    </div>
  )
}


function LandingCTAs({ type, clinicId, doctorName }: { type: 'walkin' | 'reserved', clinicId: string, doctorName: string | null }) {
  return (
    <ClientCTAs clinicId={clinicId} doctorName={doctorName} />
  )
}

import { db } from "@/db"
import { eq, and } from "drizzle-orm"
import { clinics, reviews as reviewsSchema, services } from "@/db/schema"
import { ReviewTicker } from "@/components/ReviewTicker"
import { HeroCarousel } from "@/components/HeroCarousel"
import { ClientCTAs } from "@/components/LandingPageClient"
import Link from "next/link"
import { Phone, MapPin, Coffee, CheckCircle2, Clock } from "lucide-react"
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

  // 3. Fetch Active Homepage Services
  const activeServices: any[] = await db.query.services.findMany({
    where: and(
      eq(services.clinicId, clinic.id),
      eq(services.showOnHomepage, true)
    ),
    orderBy: (fields, { asc }) => [asc(fields.order)]
  })

  const mainServices = activeServices.filter((s: any) => !s.isUpsell)
  const addonServices = activeServices.filter((s: any) => s.isUpsell)

  const waitTime = clinic.estimatedWaitMinutes || 0
  const waitTimeText = waitTime === 0 ? "0 MIN" : `${waitTime} MIN`
  const waitTimeSubtext = waitTime === 0 ? "LOW WAIT" : "EST. WAIT"
  const waitColor = waitTime < 15 ? "text-emerald-400" : waitTime < 45 ? "text-amber-400" : "text-red-400"

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30">
      {/* BRANDING HEADER */}
      <header className="pt-6 pb-2 px-6 flex justify-center items-center shrink-0">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">Est. 2024</span>
          <h1 className="text-xl font-black italic tracking-tighter text-white uppercase">KEEP AMERICA <span className="text-blue-500">TRUCKING</span></h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 py-2 overflow-y-auto overflow-x-hidden pb-24">

        {/* HERO CAROUSEL */}
        <div className="relative shrink-0 mb-4">
          <HeroCarousel
            doctorName={clinic.doctorName}
            doctorBio={clinic.doctorBio}
            doctorPicUrl={clinic.doctorPicUrl}
          />
        </div>

        {/* REVIEW TICKER (Now immediately after Hero) */}
        <div className="w-full -mx-4 overflow-hidden mb-6 shrink-0">
          <ReviewTicker reviews={featuredReviews} />
        </div>

        {/* MAIN SERVICES (Dynamic Anchoring) */}
        <div className="space-y-4 shrink-0">
          {mainServices.length > 0 ? (
            mainServices.map((service, idx) => {
              const isFirst = idx === 0;
              // Example dynamic styling based on order to create anchoring
              const cardBorder = isFirst ? (waitTime < 15 ? "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-500/5" : "border-zinc-700 bg-zinc-900/60") : "border-zinc-800 bg-zinc-900/40";
              const numberColor = isFirst ? "text-white" : "text-zinc-300";

              return (
                <div key={service.id} className={`relative p-5 rounded-2xl border backdrop-blur-md transition-all active:scale-[0.98] ${cardBorder}`}>
                  {isFirst && (
                    <div className="absolute -top-3 right-4 z-10">
                      <span className="bg-emerald-500 text-zinc-950 text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded-full shadow-lg">Fast Track</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className={`text-xl font-black italic tracking-tight ${numberColor}`}>
                        {idx + 1}. {service.name.toUpperCase()}
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 max-w-[200px] leading-relaxed">
                        {service.description || "Get your medical card quickly and efficiently."}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className={`text-2xl font-black ${isFirst ? 'text-white' : 'text-blue-400'}`}>${parseInt(service.price)}</div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {isFirst ? "Full Price" : "Discount"}
                      </div>
                    </div>
                  </div>

                  {service.type === 'walkin' ? (
                    <div className="flex items-center gap-4">
                      {isFirst && (
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`text-2xl font-black tracking-tighter ${waitColor}`}>{waitTimeText}</div>
                          <div className={`text-[8px] font-bold tracking-widest uppercase ${waitColor} opacity-80`}>{waitTimeSubtext}</div>
                        </div>
                      )}
                      <div className="flex-1">
                        <LandingCTAs type="walkin" clinicId={clinic.id} doctorName={clinic.doctorName} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <Link href="/get-my-card">
                        <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black italic rounded-xl h-12 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                          15 MINUTE PHYSICAL PLEASE.
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-4 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
              No services configured for display.
            </div>
          )}
        </div>

        {/* ADD-ON SERVICES CAROUSEL */}
        {addonServices.length > 0 && (
          <div className="mt-8 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
              <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">Premium Upgrades</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
            </div>

            <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-3 snap-x scrollbar-hide">
              {addonServices.map(addon => (
                <div key={addon.id} className="snap-center shrink-0 w-[240px] bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-sm text-white">{addon.name}</h3>
                      <span className="text-emerald-400 font-bold text-sm">+${parseInt(addon.price)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      {addon.description || `Enhance your visit with ${addon.name}.`}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-800/50 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      +{addon.duration} mins
                    </span>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2">
                      Ask Dr. Ben
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FMCSA BADGE */}
        <div className="flex justify-center pt-8 pb-4 shrink-0">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-full px-3 py-1 flex items-center gap-2 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[8px] font-bold tracking-widest text-zinc-300 uppercase">FMCSA National Registry Certified</span>
          </div>
        </div>
      </main>
    </div>
  )
}


function LandingCTAs({ type, clinicId, doctorName }: { type: 'walkin' | 'reserved', clinicId: string, doctorName: string | null }) {
  return (
    <ClientCTAs clinicId={clinicId} doctorName={doctorName} />
  )
}

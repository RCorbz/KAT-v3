import { db } from "@/db"
import { eq, and } from "drizzle-orm"
import { clinics, reviews as reviewsSchema, services } from "@/db/schema"
import { ReviewTicker } from "@/components/ReviewTicker"
import { HeroCarousel } from "@/components/HeroCarousel"
import { ClientCTAs } from "@/components/LandingPageClient"
import { Phone, MapPin, Coffee, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HomepageServiceCard } from "@/components/HomepageServiceCard"
import { HomepageAddonCard } from "@/components/HomepageAddonCard"

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
  const addonServices = activeServices.filter((s: any) => s.isUpsell).slice(0, 2)

  const waitTime = clinic.estimatedWaitMinutes || 0
  const waitTimeText = waitTime === 0 ? "0 MIN" : `${waitTime} MIN`
  const waitTimeSubtext = waitTime === 0 ? "LOW WAIT" : "EST. WAIT"
  const waitColor = waitTime < 15 ? "text-emerald-400" : waitTime < 45 ? "text-amber-400" : "text-red-400"

  const heroIntro = (clinic.heroIntro as any) || {}
  const estYear = heroIntro.estYear || "2024"
  const titlePart1 = heroIntro.heroTitlePart1 || "KEEP AMERICA"
  const titlePart2 = heroIntro.heroTitlePart2 || "TRUCKING"

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30">
      {/* BRANDING HEADER */}
      <header className="pt-6 pb-2 px-4 flex justify-center items-center shrink-0 overflow-hidden">
        <div className="flex flex-col items-center w-full max-w-full">
          <h1 className="text-[clamp(1.25rem,8vw,6rem)] font-black italic tracking-tighter text-white uppercase text-center leading-[0.85] mb-2 whitespace-nowrap">
            {titlePart1} <span className="text-blue-500">{titlePart2}</span>
          </h1>
          <span className="text-[10px] md:text-sm font-black tracking-[0.4em] text-zinc-500 uppercase">Est. {estYear}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 py-2 overflow-y-auto overflow-x-hidden pb-24">

        {/* HERO CAROUSEL */}
        <div className="relative shrink-0 mb-4">
          <HeroCarousel
            doctorName={clinic.doctorName}
            doctorBio={clinic.doctorBio}
            doctorPicUrl={clinic.doctorPicUrl}
            heroIntro={clinic.heroIntro as any}
            clinicAddress={`${clinic.address}, ${clinic.city}, ${clinic.state} ${clinic.zip}`}
            clinicPhone={clinic.phone}
          />
        </div>

        {/* REVIEW TICKER (Now immediately after Hero) */}
        <div className="w-full -mx-4 overflow-hidden mb-6 shrink-0">
          <ReviewTicker reviews={featuredReviews} />
        </div>

        {/* MAIN SERVICES (Dynamic Anchoring & Expandable) */}
        <div className="space-y-3 shrink-0">
          {mainServices.length > 0 ? (
            mainServices.map((service, idx) => (
              <HomepageServiceCard
                key={service.id}
                service={service}
                idx={idx}
                isFirst={idx === 0}
                waitTime={waitTime}
                waitTimeText={waitTimeText}
                waitTimeSubtext={waitTimeSubtext}
                waitColor={waitColor}
                clinicId={clinic.id}
                doctorName={clinic.doctorName}
              />
            ))
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

            <div className="grid grid-cols-2 gap-3 pb-4">
              {addonServices.map(addon => (
                <HomepageAddonCard key={addon.id} addon={addon} />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

import { db } from "@/db"
import { count, eq, and, gte, lte } from "drizzle-orm"
import { services, appointments, reviews, retentionLogs } from "@/db/schema"

import { squareClient } from "@/lib/square"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, addWeeks, startOfDay, endOfDay } from "date-fns"
import { ClinicSettingsManager } from "./ClinicSettingsManager"
import { clinics } from "@/db/schema"

export const dynamic = 'force-dynamic'

async function getSquareAOV() {
    try {
        const now = new Date()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(now.getDate() - 30)

        // Use proper ISO string format for Square API
        const response = await squareClient.orders.search({
            locationIds: [], // Fetch all or specific if needed
            query: {
                filter: {
                    dateTimeFilter: {
                        createdAt: {
                            startAt: thirtyDaysAgo.toISOString(),
                            endAt: now.toISOString()
                        }
                    },
                    stateFilter: {
                        states: ["COMPLETED"]
                    }
                }
            }
        })

        const orders = response.orders || []
        if (orders.length === 0) {
            const allServices = await db.select().from(services)
            if (allServices.length > 0) {
                return allServices.reduce((sum, s) => sum + Number(s.price), 0) / allServices.length
            }
            return 130 // Ultimate fallback
        }

        const totalRevenue = orders.reduce((sum: number, order: any) => {
            return sum + Number(order.totalMoney?.amount || 0)
        }, 0)

        const totalRevenue_dollars = totalRevenue / 100

        return totalRevenue_dollars / orders.length
    } catch (e: any) {
        // Silently catch Square API 401 Unauthorized errors (expected when locally testing without a real Square Token)
        // Next.js dev server intercepts console.error and paints a full-screen red crash overlay, so we avoid it.
        const msg = e?.message || "Unknown error";
        if (!msg.includes("UNAUTHORIZED")) {
            console.warn("[Square API Fallback]:", msg);
        }

        const allServices = await db.select().from(services)
        if (allServices.length > 0) {
            return allServices.reduce((sum, s) => sum + Number(s.price), 0) / allServices.length
        }
        return 130
    }
}

async function getDueUsersCount(weeks: number) {
    const now = new Date()
    const targetDate = addWeeks(now, weeks)
    const start = startOfDay(targetDate)
    const end = endOfDay(addWeeks(targetDate, 1)) // 1 week window around target? Prompt says "due in 2 weeks".

    // Logic: Due date = Last Appointment + 2 Years.
    // So Last Appointment was targetDate - 2 Years.
    const twoYearsAgoStart = new Date(start)
    twoYearsAgoStart.setFullYear(start.getFullYear() - 2)
    const twoYearsAgoEnd = new Date(end)
    twoYearsAgoEnd.setFullYear(end.getFullYear() - 2)

    const result = await db.select({ value: count() }).from(appointments).where(
        and(
            gte(appointments.startTime, twoYearsAgoStart),
            lte(appointments.startTime, twoYearsAgoEnd),
            eq(appointments.status, "completed")
        )
    )
    return result[0].value
}

async function getSentimentMetrics() {
    const allReviews = await db.select().from(reviews)

    const posCounts: Record<string, number> = {}
    const negCounts: Record<string, number> = {}

    allReviews.forEach(r => {
        if (!r.aiTheme) return;
        if (r.rating === 5) {
            posCounts[r.aiTheme] = (posCounts[r.aiTheme] || 0) + 1
        } else {
            negCounts[r.aiTheme] = (negCounts[r.aiTheme] || 0) + 1
        }
    })

    const topPositives = Object.entries(posCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([theme, count]) => ({ theme, count }))

    const topNegatives = Object.entries(negCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([theme, count]) => ({ theme, count }))

    return { topPositives, topNegatives }
}

async function getRetentionMetrics() {
    const allAppts = await db.select().from(appointments);
    const allLogs = await db.select().from(retentionLogs);

    const userAppts = new Map<string, typeof allAppts>();
    allAppts.forEach(a => {
        if (!userAppts.has(a.userId)) userAppts.set(a.userId, []);
        userAppts.get(a.userId)!.push(a);
    });

    let firstTimeUsers = 0;
    let returningUsers = 0;
    let campaignDrivenAppointments = 0;

    let smsSent = 0;
    let emailSent = 0;
    let smsDriven = 0;
    let emailDriven = 0;

    const organicChannels: Record<string, number> = {
        "Online Search": 0,
        "Ads / Social Media": 0,
        "Referral": 0,
        "Other": 0
    }

    allLogs.forEach(log => {
        if (log.campaign.toLowerCase().includes('email')) emailSent++;
        else smsSent++;
    })

    userAppts.forEach(appts => {
        appts.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        if (appts.length >= 1) {
            // Attribution on first appointment
            const firstAppt = appts[0];
            if (firstAppt.intakeAnswers && typeof firstAppt.intakeAnswers === 'object') {
                const answer = (firstAppt.intakeAnswers as any).howDidYouHear;
                if (answer && organicChannels[answer] !== undefined) {
                    organicChannels[answer]++;
                } else if (answer) {
                    organicChannels["Other"]++;
                }
            }
        }

        if (appts.length === 1) {
            firstTimeUsers++;
        } else if (appts.length > 1) {
            returningUsers++;

            const returningAppts = appts.slice(1);

            returningAppts.forEach(ra => {
                let attributedToSms = false;
                let attributedToEmail = false;

                const hasAttribution = allLogs.some(log => {
                    const daysDiff = (ra.startTime.getTime() - log.sentAt.getTime()) / (1000 * 60 * 60 * 24);
                    const isInWindow = log.userId === ra.userId && daysDiff >= 0 && daysDiff <= 30;

                    if (isInWindow) {
                        if (log.campaign.toLowerCase().includes('email')) attributedToEmail = true;
                        else attributedToSms = true;
                    }
                    return isInWindow;
                });

                if (hasAttribution) {
                    campaignDrivenAppointments++;
                    if (attributedToSms) smsDriven++;
                    if (attributedToEmail) emailDriven++;
                }
            });
        }
    });

    const totalClients = firstTimeUsers + returningUsers;
    const retentionRate = totalClients > 0 ? (returningUsers / totalClients) * 100 : 0;
    const outreachConversionRate = allLogs.length > 0 ? (campaignDrivenAppointments / allLogs.length) * 100 : 0;

    const smsConversionRate = smsSent > 0 ? (smsDriven / smsSent) * 100 : 0;
    const emailConversionRate = emailSent > 0 ? (emailDriven / emailSent) * 100 : 0;

    return {
        totalClients,
        firstTimeUsers,
        returningUsers,
        retentionRate,
        campaignDrivenAppointments,
        outreachConversionRate,
        totalLogs: allLogs.length,
        smsSent,
        smsDriven,
        smsConversionRate,
        emailSent,
        emailDriven,
        emailConversionRate,
        organicChannels
    };
}

export default async function AdminDashboard() {
    const headquarterClinic = await db.query.clinics.findFirst({
        where: eq(clinics.slug, "weatherford-tx") // Using the main clinic for now
    })

    const aov = await getSquareAOV()
    const sentiment = await getSentimentMetrics()
    const rm = await getRetentionMetrics()

    // Use actual retention rate for projections, fallback to industry avg (17%) if 0
    const retentionRate = rm.retentionRate > 0 ? (rm.retentionRate / 100) : 0.17

    const weeks = [2, 4, 6]
    const projections = await Promise.all(weeks.map(async w => {
        const count = await getDueUsersCount(w)
        return {
            week: w,
            count,
            revenue: count * retentionRate * aov
        }
    }))

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Business Intelligence</h1>
            </div>

            {headquarterClinic && (
                <ClinicSettingsManager
                    clinicId={headquarterClinic.id}
                    initialWaitTime={headquarterClinic.estimatedWaitMinutes || 0}
                    initialWalkInPrice={headquarterClinic.walkInPrice || "125.00"}
                    initialReservedPrice={headquarterClinic.reservedPrice || "99.00"}
                />
            )}

            <Tabs defaultValue="revenue" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md h-auto p-1 bg-zinc-100 mb-8 rounded-lg overflow-hidden">
                    <TabsTrigger value="revenue" className="py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Revenue</TabsTrigger>
                    <TabsTrigger value="retention" className="py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Retention</TabsTrigger>
                    <TabsTrigger value="reputation" className="py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Reputation</TabsTrigger>
                </TabsList>

                {/* --- REVENUE TAB --- */}
                <TabsContent value="revenue" className="space-y-8 mt-0 animate-in fade-in-50 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">30-Day AOV</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${aov.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">Retention Baseline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{(retentionRate * 100).toFixed(0)}%</div>
                                <p className="text-xs text-muted-foreground">Historical 4-week avg</p>
                            </CardContent>
                        </Card>
                    </div>

                    <h2 className="text-xl font-semibold">Revenue Projections</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {projections.map(p => (
                            <Card key={p.week}>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{p.week}-Week Forecast</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${p.revenue.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">{p.count} drivers due</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* --- RETENTION TAB --- */}
                <TabsContent value="retention" className="space-y-8 mt-0 animate-in fade-in-50 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Organic Attribution */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center justify-between">
                                Organic Acquisition
                                <Badge variant="outline" className="text-zinc-500">First-Time Only</Badge>
                            </h2>
                            <Card className="border-blue-100 bg-blue-50/10 h-full">
                                <CardContent className="space-y-3 pt-6">
                                    {Object.entries(rm.organicChannels).map(([key, val]) => (
                                        <div key={key} className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                                            <span className="font-semibold text-blue-700">{key}</span>
                                            <span className="text-sm rounded-full bg-blue-100 text-blue-800 px-3 py-1 font-bold">{val} clients</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Patient Mix */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center justify-between">
                                Patient Mix
                                {rm.retentionRate >= 17 ? (
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600">Beating Industry Avg</Badge>
                                ) : (
                                    <Badge variant="destructive">Below Industry Avg (17%)</Badge>
                                )}
                            </h2>
                            <Card className="border-indigo-100 bg-indigo-50/10 h-full">
                                <CardContent className="space-y-4 pt-6">
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-indigo-100 shadow-sm">
                                        <span className="font-semibold text-indigo-700">First-Time Clients</span>
                                        <span className="text-sm rounded-full bg-indigo-100 text-indigo-800 px-3 py-1 font-bold">{rm.firstTimeUsers} clients</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-indigo-100 shadow-sm">
                                        <span className="font-semibold text-indigo-700">Returning "Patrons"</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-indigo-900">{rm.retentionRate.toFixed(1)}%</span>
                                            <span className="text-sm rounded-full bg-indigo-100 text-indigo-800 px-3 py-1 font-bold">{rm.returningUsers} clients</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </div>

                    {/* Campaign Attribution Channels */}
                    <h2 className="text-xl font-semibold mt-12 mb-4">Outreach Attribution</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* SMS CARD */}
                        <Card className="border-violet-100 bg-violet-50/10">
                            <CardHeader>
                                <CardTitle className="text-violet-800 text-lg flex items-center justify-between">
                                    SMS Campaigns
                                    {rm.smsConversionRate >= 15 ? <Badge className="bg-emerald-500">Overperforming</Badge> : rm.smsConversionRate >= 10 ? <Badge className="bg-emerald-500">Healthy</Badge> : <Badge variant="secondary" className="bg-orange-100 text-orange-800">Needs Optimization</Badge>}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">Appts booked within 30 days of text. Goal: 10-15%.</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-violet-100 shadow-sm">
                                    <span className="font-semibold text-violet-700">Total SMS Sent</span>
                                    <span className="text-sm rounded-full bg-violet-100 text-violet-800 px-3 py-1 font-bold">{rm.smsSent} messages</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-violet-100 shadow-sm">
                                    <span className="font-semibold text-violet-700">Attributed Returns</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-violet-900">{rm.smsConversionRate.toFixed(1)}%</span>
                                        <span className="text-sm rounded-full bg-violet-100 text-violet-800 px-3 py-1 font-bold">{rm.smsDriven} appts</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* EMAIL CARD */}
                        <Card className="border-amber-100 bg-amber-50/10">
                            <CardHeader>
                                <CardTitle className="text-amber-800 text-lg flex items-center justify-between">
                                    Email Campaigns
                                    {rm.emailConversionRate >= 5 ? <Badge className="bg-emerald-500">Healthy</Badge> : <Badge variant="secondary" className="bg-orange-100 text-orange-800">Needs Optimization</Badge>}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">Appts booked within 30 days of email. Goal: 5%.</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-amber-100 shadow-sm">
                                    <span className="font-semibold text-amber-700">Total Emails Sent</span>
                                    <span className="text-sm rounded-full bg-amber-100 text-amber-800 px-3 py-1 font-bold">{rm.emailSent} messages</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-amber-100 shadow-sm">
                                    <span className="font-semibold text-amber-700">Attributed Returns</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-amber-900">{rm.emailConversionRate.toFixed(1)}%</span>
                                        <span className="text-sm rounded-full bg-amber-100 text-amber-800 px-3 py-1 font-bold">{rm.emailDriven} appts</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </TabsContent>

                {/* --- REPUTATION TAB --- */}
                <TabsContent value="reputation" className="space-y-8 mt-0 animate-in fade-in-50 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-emerald-100 bg-emerald-50/10">
                            <CardHeader>
                                <CardTitle className="text-emerald-800 text-lg">Top 3 Conversion Drivers</CardTitle>
                                <p className="text-xs text-muted-foreground">Highest frequency terms in 5-star reviews.</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {sentiment.topPositives.length > 0 ? sentiment.topPositives.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-100 shadow-sm">
                                        <span className="font-semibold text-emerald-700">{item.theme}</span>
                                        <span className="text-sm rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 font-bold">{item.count} Mentions</span>
                                    </div>
                                )) : <p className="text-sm text-zinc-500 italic">No positive themes detected yet.</p>}
                            </CardContent>
                        </Card>

                        <Card className="border-red-100 bg-red-50/10">
                            <CardHeader>
                                <CardTitle className="text-red-800 text-lg">Top 3 Friction Points</CardTitle>
                                <p className="text-xs text-muted-foreground">Highest frequency terms in sub-5-star reviews.</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {sentiment.topNegatives.length > 0 ? sentiment.topNegatives.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100 shadow-sm">
                                        <span className="font-semibold text-red-700">{item.theme}</span>
                                        <span className="text-sm rounded-full bg-red-100 text-red-800 px-3 py-1 font-bold">{item.count} Mentions</span>
                                    </div>
                                )) : <p className="text-sm text-zinc-500 italic">No negative themes detected yet.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    )
}

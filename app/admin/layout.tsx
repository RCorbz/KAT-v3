import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Receipt, MessageSquare, Settings, Users, ArrowLeft } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        redirect("/sign-in")
    }

    // Role check - for MVP assuming any authenticated user is admin or check specific email/role
    // if (session.user.role !== "admin") ...

    const navItems = [
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/operations", label: "Operations", icon: Settings },
        { href: "/admin/campaigns", label: "Campaigns", icon: Users },
        { href: "/admin/reputation", label: "Reputation", icon: MessageSquare },
        { href: "/", label: "Back to Site", icon: ArrowLeft },
    ]

    return (
        <div className="flex min-h-screen bg-zinc-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r px-4 py-6 hidden md:block">
                <div className="font-bold text-xl mb-8 px-2">KAT Admin</div>
                <nav className="space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    )
}

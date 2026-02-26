import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Receipt, MessageSquare, Settings, Users, ArrowLeft, Menu, ClipboardList } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        redirect("/sign-in")
    }

    // Role check - strict middleware implementation
    if (session.user.role !== "admin") {
        redirect("/sign-in")
    }

    const navItems = [
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/form-builder", label: "Intake Form", icon: ClipboardList },
        { href: "/admin/services", label: "Services", icon: Receipt },
        { href: "/admin/operations", label: "Operations", icon: Settings },
        { href: "/admin/campaigns", label: "Campaigns", icon: Users },
        { href: "/admin/reputation", label: "Reputation", icon: MessageSquare },
        { href: "/", label: "Back to Site", icon: ArrowLeft },
    ]

    return (
        <div className="flex min-h-screen bg-zinc-100">
            {/* Mobile Header Wrapper */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center px-4 justify-between">
                <div className="font-bold text-xl">KAT Admin</div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <VisuallyHidden>
                            <SheetTitle>Navigation Menu</SheetTitle>
                            <SheetDescription>Main navigation links for the admin dashboard</SheetDescription>
                        </VisuallyHidden>
                        <div className="font-bold text-xl mb-8 px-6 pt-6">KAT Admin</div>
                        <nav className="space-y-2 px-4">
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
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar */}
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
            <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-[100vw] overflow-x-hidden">
                {children}
            </main>
        </div>
    )
}

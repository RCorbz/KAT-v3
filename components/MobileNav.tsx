"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, IdCard, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const pathname = usePathname()

    const links = [
        { href: "/", label: "Home", icon: Home },
        { href: "/get-my-card", label: "Get My Card", icon: IdCard, primary: true },
        { href: "/admin", label: "Admin", icon: ShieldCheck },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
            <div className="flex justify-around items-center h-16">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-medium transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                                link.primary && "bg-primary/10 text-primary" // Highlight primary action
                            )}
                        >
                            <Icon className={cn("h-5 w-5", link.primary && "h-6 w-6")} />
                            {link.label}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}

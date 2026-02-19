import { MobileNav } from "@/components/MobileNav"

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 pb-16">
                {children}
            </main>
            <MobileNav />
        </div>
    )
}

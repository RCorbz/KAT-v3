import prisma from "@/lib/prisma"
import { updateCampaign } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default async function CampaignsPage() {
    const campaigns = await prisma.campaignSettings.findMany({
        orderBy: { triggerDays: "desc" } // 60 -> 30 -> 7
    })

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Retention Campaigns</h1>

            <div className="grid gap-6">
                {campaigns.map(campaign => (
                    <Card key={campaign.id}>
                        <CardHeader>
                            <CardTitle className="capitalize">{campaign.phaseName} (Trigger: {campaign.triggerDays} days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={async (formData) => {
                                "use server"
                                const triggerDays = Number(formData.get("triggerDays"))
                                const smsTemplate = formData.get("smsTemplate") as string
                                await updateCampaign(campaign.id, { triggerDays, smsTemplate, isActive: true })
                            }} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Trigger Days Before Expiry</Label>
                                    <Input name="triggerDays" defaultValue={campaign.triggerDays} type="number" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>SMS Template</Label>
                                    <Textarea name="smsTemplate" defaultValue={campaign.smsTemplate} rows={4} />
                                    <p className="text-xs text-muted-foreground">Supported variables: {'{FirstName}'}, {'{attachmentUrl}'}</p>
                                </div>
                                <Button type="submit">Save Changes</Button>
                            </form>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

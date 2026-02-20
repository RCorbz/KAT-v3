"use client"

import { useState } from "react"
import { upsertCampaignSetting, deleteCampaignSetting, testCampaignPhase } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, PlusCircle, Trash2, Mail, MessageSquare, Send, AlertTriangle, CheckCircle2 } from "lucide-react"

type CampaignSetting = {
    id: string
    clinicId: string
    phaseName: string
    triggerDays: number
    smsTemplate: string
    emailTemplate: string
    sendSms: boolean
    sendEmail: boolean
    isActive: boolean
    lastTestSmsStatus?: string | null
    lastTestSmsAt?: Date | string | null
    lastTestEmailStatus?: string | null
    lastTestEmailAt?: Date | string | null
}

type Clinic = {
    id: string
    name: string
    doctorPhone?: string | null
    doctorEmail?: string | null
    campaignSettings: CampaignSetting[]
}

export function RetentionCampaignsClient({ clinics }: { clinics: Clinic[] }) {
    const defaultClinicId = clinics.length > 0 ? clinics[0].id : ""
    const [selectedClinicId, setSelectedClinicId] = useState<string>(defaultClinicId)

    // Track edit mode per campaign ID to implement Edit/Cancel behaviour
    const [editingState, setEditingState] = useState<Record<string, boolean>>({})

    // For creating new phase tabs
    const [isCreatingPhase, setIsCreatingPhase] = useState(false)

    const activeClinic = clinics.find(c => c.id === selectedClinicId)
    const campaigns = [...(activeClinic?.campaignSettings || [])].sort((a, b) => b.triggerDays - a.triggerDays)

    const setEditing = (id: string, isEditing: boolean) => {
        setEditingState(prev => ({ ...prev, [id]: isEditing }))
    }

    if (!activeClinic) {
        return <div className="p-8 text-center text-muted-foreground bg-zinc-50 border rounded-xl">No clinics found. Please provision a clinic in operations first.</div>
    }

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto">
            <div className="space-y-4">
                <h1 className="text-2xl font-bold tracking-tight">Retention Campaigns</h1>

                {/* Locator Selector */}
                <div className="w-full md:w-80">
                    <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
                        <SelectTrigger className="bg-white h-11 shadow-sm">
                            <SelectValue placeholder="Select a Clinic" />
                        </SelectTrigger>
                        <SelectContent>
                            {clinics.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                    <span className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4" /> {c.name}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border overflow-hidden">
                <Tabs key={selectedClinicId} defaultValue={campaigns.length > 0 ? campaigns[0].id : "new_phase"} className="w-full">
                    {/* Tab Navigation */}
                    <div className="border-b px-2 md:px-6 py-2 bg-zinc-50 overflow-x-auto">
                        <TabsList className="bg-zinc-200/50 h-auto p-1 inline-flex w-full md:w-auto overflow-x-auto whitespace-nowrap">
                            {campaigns.map(campaign => (
                                <TabsTrigger key={campaign.id} value={campaign.id} className="px-4 py-2 text-sm capitalize">
                                    {campaign.triggerDays} Days Away, {campaign.phaseName}
                                </TabsTrigger>
                            ))}
                            <TabsTrigger value="new_phase" className="px-4 py-2 text-sm text-emerald-600 font-medium bg-emerald-50/50 data-[state=active]:bg-white data-[state=active]:text-emerald-700">
                                <PlusCircle className="w-4 h-4 mr-1.5 inline-block" /> Add Phase
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-4 md:p-8">
                        {/* Existing Phase Tabs */}
                        {campaigns.map(campaign => {
                            const isEditing = editingState[campaign.id] || false
                            return (
                                <TabsContent key={campaign.id} value={campaign.id} className="m-0 space-y-6 animate-in fade-in duration-300">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-semibold capitalize">{campaign.phaseName} <span className="text-muted-foreground font-normal text-sm ml-2">(Trigger: {campaign.triggerDays} days prior to DOT expiration)</span></h3>
                                            <p className="text-sm text-muted-foreground mt-1">Configure automated notifications sent prior to DOT expiration.</p>
                                        </div>
                                    </div>

                                    <form action={async (formData) => {
                                        await upsertCampaignSetting(activeClinic.id, {
                                            id: campaign.id,
                                            phaseName: formData.get("phaseName") as string,
                                            triggerDays: Number(formData.get("triggerDays")),
                                            smsTemplate: formData.get("smsTemplate") as string,
                                            emailTemplate: formData.get("emailTemplate") as string,
                                            sendSms: formData.get("sendSms") === "on",
                                            sendEmail: formData.get("sendEmail") === "on",
                                            isActive: formData.get("isActive") === "on"
                                        })
                                        setEditing(campaign.id, false)
                                    }} className="space-y-8 max-w-4xl pt-4">

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50/50 p-6 rounded-xl border border-zinc-100">
                                            <div className="space-y-4 col-span-1 border-b md:border-b-0 md:border-r border-zinc-200 pb-6 md:pb-0 md:pr-6">
                                                <div className="space-y-2">
                                                    <Label className="uppercase text-xs font-bold text-zinc-500 tracking-wide">Phase Identifier</Label>
                                                    <Input name="phaseName" defaultValue={campaign.phaseName} disabled={!isEditing} placeholder="e.g. Final Notice" className="bg-white" />
                                                </div>
                                                <div className="space-y-2 pt-2">
                                                    <Label className="uppercase text-xs font-bold text-zinc-500 tracking-wide">Trigger Days Before Expiry</Label>
                                                    <Input name="triggerDays" defaultValue={campaign.triggerDays} type="number" disabled={!isEditing} className="bg-white font-medium text-lg h-12" />
                                                </div>
                                            </div>

                                            <div className="space-y-4 col-span-1 border-t md:border-t-0 md:border-l border-zinc-200 pt-6 md:pt-0 md:pl-6">
                                                <Label className="uppercase text-xs font-bold text-zinc-500 tracking-wide">Delivery Channels</Label>
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><MessageSquare className="w-4 h-4" /></div>
                                                            <Label className="font-semibold cursor-pointer">Enable SMS</Label>
                                                        </div>
                                                        <Switch name="sendSms" defaultChecked={campaign.sendSms} disabled={!isEditing} />
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md"><Mail className="w-4 h-4" /></div>
                                                            <Label className="font-semibold cursor-pointer">Enable Email</Label>
                                                        </div>
                                                        <Switch name="sendEmail" defaultChecked={campaign.sendEmail} disabled={!isEditing} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="font-semibold flex items-center gap-2 text-zinc-700">
                                                    <MessageSquare className="w-4 h-4 text-zinc-400" /> SMS Output Template
                                                </Label>
                                                <Textarea name="smsTemplate" defaultValue={campaign.smsTemplate} rows={5} disabled={!isEditing} className="bg-white resize-none" placeholder="e.g. Hi {FirstName}, your..." />
                                                <p className="text-[11px] text-muted-foreground font-mono">Variables: {'{FirstName}'}, {'{attachmentUrl}'}</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="font-semibold flex items-center gap-2 text-zinc-700">
                                                    <Mail className="w-4 h-4 text-zinc-400" /> Email Output Content (HTML)
                                                </Label>
                                                <Textarea name="emailTemplate" defaultValue={campaign.emailTemplate} rows={5} disabled={!isEditing} className="bg-white font-mono text-sm resize-none" placeholder="<p>Hi {FirstName},...</p>" />
                                                <p className="text-[11px] text-muted-foreground font-mono">Variables: {'{FirstName}'}, {'{attachmentUrl}'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t flex-wrap sm:flex-nowrap gap-4">
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <Label className="text-[10px] uppercase font-black text-zinc-400 tracking-wider bg-zinc-100 px-2 py-1 rounded hidden sm:inline-block">Campaign Active</Label>
                                                <Switch name="isActive" defaultChecked={campaign.isActive} disabled={!isEditing} />
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <Button type="button" variant="outline" className="h-10 border-zinc-200 flex-1 sm:flex-none" onClick={() => setEditing(campaign.id, false)}>Cancel</Button>
                                                        <Button type="submit" className="h-10 bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none">Save Changes</Button>
                                                    </div>
                                                ) : (
                                                    <Button type="button" variant="secondary" className="h-10 bg-zinc-900 text-white hover:bg-zinc-800 w-full sm:w-auto" onClick={() => setEditing(campaign.id, true)}>Edit Payload</Button>
                                                )}

                                                <button
                                                    type="button"
                                                    disabled={!isEditing}
                                                    className="w-10 h-10 flex flex-shrink-0 items-center justify-center text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent disabled:opacity-50"
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        if (confirm("Are you sure you want to delete this phase? This cannot be undone.")) {
                                                            await deleteCampaignSetting(campaign.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </form>

                                    {!isEditing && (
                                        <TestCampaignSection campaign={campaign} clinic={activeClinic} />
                                    )}
                                </TabsContent>
                            )
                        })}

                        {/* New Phase Tab */}
                        <TabsContent value="new_phase" className="m-0 space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold flex items-center gap-2"><PlusCircle className="text-emerald-500 w-5 h-5" /> New Action Phase</h3>
                                <p className="text-sm text-muted-foreground mt-1">Deploy a new automated tracking phase to this location's campaign trajectory.</p>
                            </div>

                            <form action={async (formData) => {
                                await upsertCampaignSetting(activeClinic.id, {
                                    phaseName: formData.get("phaseName") as string,
                                    triggerDays: Number(formData.get("triggerDays")),
                                    smsTemplate: formData.get("smsTemplate") as string,
                                    emailTemplate: formData.get("emailTemplate") as string,
                                    sendSms: formData.get("sendSms") === "on",
                                    sendEmail: formData.get("sendEmail") === "on",
                                    isActive: true
                                })
                                // Form resets naturally since tab will switch away typically or reload on action completion
                            }} className="space-y-6 max-w-4xl pt-4">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-emerald-50/30 p-6 rounded-xl border border-emerald-100/50">
                                    <div className="space-y-4 col-span-1">
                                        <div className="space-y-2">
                                            <Label className="uppercase text-xs font-bold text-zinc-500 tracking-wide">Phase Identifier</Label>
                                            <Input name="phaseName" required placeholder="e.g. phase4 or final_notice" className="bg-white" />
                                            <p className="text-[11px] text-muted-foreground">Internal naming convention identifier.</p>
                                        </div>

                                        <div className="space-y-2 pt-2 border-t border-emerald-100">
                                            <Label className="uppercase text-xs font-bold text-zinc-500 tracking-wide">Trigger Days Before Expiry</Label>
                                            <Input name="triggerDays" required type="number" placeholder="e.g. 14" className="bg-white h-12 text-lg font-medium" />
                                        </div>
                                    </div>

                                    <div className="space-y-4 col-span-1 border-t md:border-t-0 md:border-l border-emerald-100 pt-6 md:pt-0 md:pl-6">
                                        <Label className="uppercase text-xs font-bold text-zinc-500 tracking-wide">Delivery Channels</Label>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><MessageSquare className="w-4 h-4" /></div>
                                                    <Label className="font-semibold cursor-pointer">Enable SMS</Label>
                                                </div>
                                                <Switch name="sendSms" defaultChecked />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md"><Mail className="w-4 h-4" /></div>
                                                    <Label className="font-semibold cursor-pointer">Enable Email</Label>
                                                </div>
                                                <Switch name="sendEmail" defaultChecked={false} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 border border-dashed border-zinc-200 rounded-xl overflow-hidden divide-y">
                                    <div className="p-6 bg-white space-y-3">
                                        <Label className="font-semibold flex items-center gap-2 text-zinc-700">
                                            <MessageSquare className="w-4 h-4 text-zinc-400" /> SMS Output Template
                                        </Label>
                                        <Textarea name="smsTemplate" rows={4} className="bg-zinc-50 resize-y" placeholder="Hi {FirstName}, you have {triggerDays} days left..." />
                                    </div>

                                    <div className="p-6 bg-white space-y-3">
                                        <Label className="font-semibold flex items-center gap-2 text-zinc-700">
                                            <Mail className="w-4 h-4 text-zinc-400" /> Email Output Content (HTML)
                                        </Label>
                                        <Textarea name="emailTemplate" rows={6} className="bg-zinc-50 font-mono text-sm resize-y" placeholder="<p>Immediate action required for {FirstName}</p>" />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8 rounded-full shadow-md shadow-emerald-200"><PlusCircle className="w-4 h-4 mr-2" /> Add Phase</Button>
                                </div>
                            </form>

                        </TabsContent>

                    </div>
                </Tabs>
            </div>
        </div>
    )
}

function formatPhone(value: string) {
    if (!value) return value
    const phoneNumber = value.replace(/[^\d]/g, '')
    const phoneNumberLength = phoneNumber.length
    if (phoneNumberLength < 4) return phoneNumber
    if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
}

function TestCampaignSection({ campaign, clinic }: { campaign: CampaignSetting, clinic: Clinic }) {
    const [phone, setPhone] = useState(formatPhone(clinic.doctorPhone || ""))
    const [email, setEmail] = useState(clinic.doctorEmail || "")
    const [isTestingSms, setIsTestingSms] = useState(false)
    const [isTestingEmail, setIsTestingEmail] = useState(false)

    const handleTestSms = async () => {
        if (!phone) return alert("Please enter a phone number.")
        setIsTestingSms(true)
        try {
            await testCampaignPhase(campaign.id, phone, "")
        } catch (e) {
            console.error(e)
        } finally {
            setIsTestingSms(false)
        }
    }

    const handleTestEmail = async () => {
        if (!email) return alert("Please enter an email address.")
        setIsTestingEmail(true)
        try {
            await testCampaignPhase(campaign.id, "", email)
        } catch (e) {
            console.error(e)
        } finally {
            setIsTestingEmail(false)
        }
    }

    return (
        <div className="mt-8 p-6 bg-zinc-50 border rounded-xl border-dashed shadow-sm">
            <div className="mb-4">
                <h4 className="text-lg font-semibold flex items-center gap-2 text-zinc-800">
                    <Send className="w-5 h-5 text-blue-500" />
                    Test Campaign Capabilities
                </h4>
                <p className="text-sm text-muted-foreground">Verify your templates by sending a live test to a designated contact.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <Label className="uppercase text-xs font-bold text-zinc-500 tracking-wide">Test Mobile Number</Label>
                    <div className="flex gap-2">
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            placeholder="(555) 555-5555"
                            maxLength={14}
                            className="bg-white object-contain min-w-48"
                        />
                        <Button
                            type="button"
                            onClick={handleTestSms}
                            disabled={isTestingSms}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 shrink-0"
                        >
                            {isTestingSms ? 'Sending...' : 'Send SMS'}
                        </Button>
                    </div>
                    {!isTestingSms && campaign.lastTestSmsStatus?.includes('success') && (
                        <p className={`text-xs font-medium flex items-center gap-1 ${campaign.lastTestSmsStatus.includes('mocked') ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {campaign.lastTestSmsStatus.includes('mocked') ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            Last SMS test {campaign.lastTestSmsStatus.includes('mocked') ? 'mocked' : 'sent live'} on {new Date(campaign.lastTestSmsAt!).toLocaleDateString()} {new Date(campaign.lastTestSmsAt!).toLocaleTimeString()}
                        </p>
                    )}
                    {!isTestingSms && campaign.lastTestSmsStatus === 'error' && (
                        <p className="text-red-600 text-xs font-medium flex items-center gap-1">❌ Last SMS test failed on {new Date(campaign.lastTestSmsAt!).toLocaleDateString()} {new Date(campaign.lastTestSmsAt!).toLocaleTimeString()}</p>
                    )}
                    {isTestingSms && <p className="text-blue-600 text-xs font-medium flex items-center gap-1">Sending test SMS...</p>}
                </div>

                <div className="space-y-3">
                    <Label className="uppercase text-xs font-bold text-zinc-500 tracking-wide">Test Email Address</Label>
                    <div className="flex gap-2">
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="doctor@clinic.com"
                            type="email"
                            className="bg-white min-w-48 max-w-sm"
                        />
                        <Button
                            type="button"
                            onClick={handleTestEmail}
                            disabled={isTestingEmail}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 shrink-0"
                        >
                            {isTestingEmail ? 'Sending...' : 'Send Email'}
                        </Button>
                    </div>
                    {!isTestingEmail && campaign.lastTestEmailStatus?.includes('success') && (
                        <p className={`text-xs font-medium flex items-center gap-1 ${campaign.lastTestEmailStatus.includes('mocked') ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {campaign.lastTestEmailStatus.includes('mocked') ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            Last Email test {campaign.lastTestEmailStatus.includes('mocked') ? 'mocked' : 'sent live'} on {new Date(campaign.lastTestEmailAt!).toLocaleDateString()} {new Date(campaign.lastTestEmailAt!).toLocaleTimeString()}
                        </p>
                    )}
                    {!isTestingEmail && campaign.lastTestEmailStatus === 'error' && (
                        <p className="text-red-600 text-xs font-medium flex items-center gap-1">❌ Last Email test failed on {new Date(campaign.lastTestEmailAt!).toLocaleDateString()} {new Date(campaign.lastTestEmailAt!).toLocaleTimeString()}</p>
                    )}
                    {isTestingEmail && <p className="text-blue-600 text-xs font-medium flex items-center gap-1">Sending test Email...</p>}
                </div>
            </div>
        </div>
    )
}

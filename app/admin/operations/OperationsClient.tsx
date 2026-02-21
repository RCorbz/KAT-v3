"use client"

import { useState, useRef } from "react"
import { updateService, updateSchedule, createClinic, updateClinic, createService, deleteService, createSchedule, deleteSchedule, updateClinicDoctorInfo } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, PlusCircle, Building2, UserCircle, MapPin, Briefcase, Clock, Plus } from "lucide-react"

const US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
]

const DOCTOR_TYPES = ["Chiropractor", "Fascia Release Specialist", "Massage Therapist"]

type Clinic = any // Passed from server

export function OperationsClient({ clinics }: { clinics: Clinic[] }) {
    const [selectedClinicId, setSelectedClinicId] = useState<string>(clinics[0]?.id || "new")
    const [additionalFields, setAdditionalFields] = useState<{ key: string, value: string }[]>([])

    const activeClinic = clinics.find(c => c.id === selectedClinicId)

    // Doctor Profile dynamic states
    const initialType = activeClinic?.doctorType || ""
    const isCustom = initialType && !DOCTOR_TYPES.includes(initialType)
    const [selectedDoctorType, setSelectedDoctorType] = useState<string>(isCustom ? "Other" : initialType)
    const [customDoctorType, setCustomDoctorType] = useState<string>(isCustom ? initialType : "")
    const [doctorPicBase64, setDoctorPicBase64] = useState<string>(activeClinic?.doctorPicUrl || "")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isEditingDoctor, setIsEditingDoctor] = useState(false)

    // Reset additional fields when clinic changes
    const handleClinicChange = (id: string) => {
        setSelectedClinicId(id)
        const clinic = clinics.find(c => c.id === id)
        if (clinic?.additionalInfo) {
            try {
                const info = typeof clinic.additionalInfo === 'string'
                    ? JSON.parse(clinic.additionalInfo)
                    : clinic.additionalInfo
                setAdditionalFields(Object.entries(info).map(([k, v]) => ({ key: k, value: String(v) })))
            } catch (e) {
                setAdditionalFields([])
            }
        } else {
            setAdditionalFields([])
        }

        setIsEditingDoctor(false)
        const type = clinic?.doctorType || ""
        if (DOCTOR_TYPES.includes(type)) {
            setSelectedDoctorType(type)
            setCustomDoctorType("")
        } else if (type) {
            setSelectedDoctorType("Other")
            setCustomDoctorType(type)
        } else {
            setSelectedDoctorType("")
            setCustomDoctorType("")
        }
        setDoctorPicBase64(clinic?.doctorPicUrl || "")
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setDoctorPicBase64(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const addField = () => setAdditionalFields([...additionalFields, { key: "", value: "" }])
    const removeField = (index: number) => setAdditionalFields(additionalFields.filter((_, i) => i !== index))
    const updateField = (index: number, k: string, v: string) => {
        const next = [...additionalFields]
        next[index] = { key: k, value: v }
        setAdditionalFields(next)
    }

    const formatPhone = (value: string) => {
        if (!value) return value;
        const phone = value.replace(/[^\d]/g, "");
        const length = phone.length;
        if (length < 4) return phone;
        if (length < 7) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
        return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
    }

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto">
            <div className="space-y-4">
                <h1 className="text-2xl font-bold tracking-tight">Operations Management</h1>

                <div className="w-full md:w-80">
                    <Select value={selectedClinicId} onValueChange={handleClinicChange}>
                        <SelectTrigger className="bg-white h-11 shadow-sm">
                            <SelectValue placeholder="Select a Clinic" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new">
                                <span className="flex items-center gap-2 font-medium text-emerald-600">
                                    <PlusCircle className="w-4 h-4" /> Add New Clinic
                                </span>
                            </SelectItem>
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

            {selectedClinicId === "new" ? (
                <Card className="bg-white border-emerald-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-emerald-50/50 border-b">
                        <CardTitle className="text-emerald-800 text-lg flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-emerald-600" /> Provision New Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form action={async (formData) => {
                            await createClinic({
                                name: formData.get("name") as string,
                                address: formData.get("address") as string,
                                city: formData.get("city") as string,
                                state: formData.get("state") as string,
                                zip: formData.get("zip") as string,
                                phone: formData.get("phone") as string
                            })
                        }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                            <div className="space-y-2"><Label>Clinic Name</Label><Input name="name" required placeholder="Denver HQ" className="bg-white" /></div>
                            <div className="space-y-2"><Label>Address</Label><Input name="address" required placeholder="123 Main St" className="bg-white" /></div>
                            <div className="space-y-2"><Label>City</Label><Input name="city" required placeholder="Denver" className="bg-white" /></div>
                            <div className="space-y-2">
                                <Label>State</Label>
                                <Select name="state" required>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select State" /></SelectTrigger>
                                    <SelectContent>
                                        {US_STATES.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"><Label>Zip</Label><Input name="zip" required placeholder="80202" className="bg-white" /></div>
                            <div className="space-y-2"><Label>Public Phone</Label><Input name="phone" required placeholder="(555) 555-5555" maxLength={14} className="bg-white" onChange={(e) => e.target.value = formatPhone(e.target.value)} /></div>
                            <div className="lg:col-span-3 pt-4">
                                <Button type="submit" className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 h-11">Create New Location</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : activeClinic ? (
                <div key={selectedClinicId} className="bg-white rounded-xl shadow-md border overflow-hidden">
                    <Tabs defaultValue="address" className="w-full">
                        <div className="border-b px-2 md:px-6 py-2 bg-zinc-50 overflow-x-auto">
                            <TabsList className="bg-zinc-200/50 h-auto p-1 inline-flex w-full md:w-auto overflow-x-auto whitespace-nowrap">
                                <TabsTrigger value="address" className="px-4 py-2 text-xs md:text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Location & Address</span><span className="sm:hidden">Location</span></TabsTrigger>
                                <TabsTrigger value="doctor" className="px-4 py-2 text-xs md:text-sm flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Doctor Profile</span><span className="sm:hidden">Doctor</span></TabsTrigger>
                                <TabsTrigger value="services" className="px-4 py-2 text-xs md:text-sm flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Services & Pricing</span><span className="sm:hidden">Services</span></TabsTrigger>
                                <TabsTrigger value="schedules" className="px-4 py-2 text-xs md:text-sm flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Operating Hours</span><span className="sm:hidden">Hours</span></TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-4 md:p-8">
                            {/* LOCATION & ADDRESS */}
                            <TabsContent value="address" className="m-0 space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold">Location Details</h3>
                                    <p className="text-sm text-muted-foreground">Modify the physical routing address and contact parameters.</p>
                                </div>
                                <form action={async (formData) => {
                                    await updateClinic(activeClinic.id, {
                                        name: formData.get("name") as string,
                                        address: formData.get("address") as string,
                                        city: formData.get("city") as string,
                                        state: formData.get("state") as string,
                                        zip: formData.get("zip") as string,
                                        phone: formData.get("phone") as string,
                                        isActive: formData.get("isActive") === "on"
                                    })
                                }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                                    <div className="space-y-2"><Label>Clinic Name</Label><Input name="name" defaultValue={activeClinic.name} /></div>
                                    <div className="space-y-2"><Label>Address</Label><Input name="address" defaultValue={activeClinic.address} /></div>
                                    <div className="space-y-2"><Label>City</Label><Input name="city" defaultValue={activeClinic.city} /></div>
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Select name="state" defaultValue={activeClinic.state}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {US_STATES.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2"><Label>Zip</Label><Input name="zip" defaultValue={activeClinic.zip} /></div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input name="phone" defaultValue={formatPhone(activeClinic.phone)} maxLength={14} onChange={(e) => e.target.value = formatPhone(e.target.value)} />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-center gap-4 mt-6 pt-6 border-t">
                                        <div className="flex items-center justify-between w-full md:w-auto gap-4 bg-zinc-50 px-4 py-2 rounded-lg border">
                                            <Label className="font-semibold whitespace-nowrap">Accepting Appointments</Label>
                                            <Switch name="isActive" defaultChecked={activeClinic.isActive} />
                                        </div>
                                        <Button type="submit" className="w-full md:w-auto h-11 px-8 bg-zinc-900">Save Location Adjustments</Button>
                                    </div>
                                </form>
                            </TabsContent>

                            {/* DOCTOR INFO */}
                            <TabsContent value="doctor" className="m-0 space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold">Doctor Profile</h3>
                                    <p className="text-sm text-muted-foreground">Manage the public facing provider info and special attributes.</p>
                                </div>
                                <form action={async (formData) => {
                                    const extra: Record<string, string> = {}
                                    additionalFields.forEach(f => { if (f.key) extra[f.key] = f.value })

                                    const typeVal = formData.get("uiDoctorType") as string
                                    const finalType = typeVal === "Other" ? (formData.get("customDoctorType") as string) : typeVal

                                    await updateClinicDoctorInfo(activeClinic.id, {
                                        doctorName: formData.get("doctorName") as string,
                                        doctorPicUrl: formData.get("doctorPicUrl") as string,
                                        doctorBio: formData.get("doctorBio") as string,
                                        doctorPhone: formData.get("doctorPhone") as string,
                                        doctorEmail: formData.get("doctorEmail") as string,
                                        doctorType: finalType,
                                        additionalInfo: JSON.stringify(extra)
                                    })
                                    setIsEditingDoctor(false)
                                }} className="space-y-8 max-w-4xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2"><Label>Doctor Name</Label><Input name="doctorName" defaultValue={activeClinic.doctorName || ""} placeholder="Dr. John Doe" disabled={!isEditingDoctor} /></div>

                                        <div className="space-y-2">
                                            <Label>Doctor Profession</Label>
                                            <Select name="uiDoctorType" value={selectedDoctorType} onValueChange={setSelectedDoctorType} disabled={!isEditingDoctor}>
                                                <SelectTrigger><SelectValue placeholder="Select Profession" /></SelectTrigger>
                                                <SelectContent>
                                                    {DOCTOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                    <SelectItem value="Other">Other (Add Custom)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {selectedDoctorType === "Other" && (
                                                <Input name="customDoctorType" value={customDoctorType} onChange={e => setCustomDoctorType(e.target.value)} placeholder="Enter Custom Profession" className="mt-2 text-sm bg-blue-50/50 border-blue-200" disabled={!isEditingDoctor} />
                                            )}
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Doctor Photo</Label>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-xl bg-zinc-50/50">
                                                {doctorPicBase64 ? (
                                                    <img src={doctorPicBase64} alt="Doctor preview" className="w-16 h-16 rounded-full object-cover border-2 shadow-sm bg-white" />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-zinc-200 border-2 border-dashed flex items-center justify-center text-zinc-400">
                                                        <UserCircle className="w-8 h-8" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} disabled={!isEditingDoctor} className="cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 bg-white" />
                                                    <input type="hidden" name="doctorPicUrl" value={doctorPicBase64} />
                                                    <p className="text-xs text-muted-foreground mt-2">Select an image from your device. Recommended: Square ratio.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:col-span-2"><Label>Short Bio</Label><Input name="doctorBio" defaultValue={activeClinic.doctorBio || ""} placeholder="Experienced in family medicine..." disabled={!isEditingDoctor} /></div>
                                        <div className="space-y-2">
                                            <Label>Mobile Phone</Label>
                                            <Input name="doctorPhone" defaultValue={formatPhone(activeClinic.doctorPhone)} maxLength={14} onChange={(e) => e.target.value = formatPhone(e.target.value)} placeholder="(555) 555-5555" disabled={!isEditingDoctor} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email Address</Label>
                                            <Input name="doctorEmail" type="email" defaultValue={activeClinic.doctorEmail || ""} placeholder="doctor@clinic.com" disabled={!isEditingDoctor} />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Additional Attributes</Label>
                                            {isEditingDoctor && <Button type="button" variant="outline" size="sm" onClick={addField} className="h-8"><Plus className="w-3 h-3 mr-1" /> Add Field</Button>}
                                        </div>

                                        <div className="space-y-3">
                                            {additionalFields.map((field, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <Input placeholder="Label" value={field.key} onChange={(e) => updateField(i, e.target.value, field.value)} className="w-1/3 h-9" disabled={!isEditingDoctor} />
                                                    <Input placeholder="Value" value={field.value} onChange={(e) => updateField(i, field.key, e.target.value)} className="flex-1 h-9" disabled={!isEditingDoctor} />
                                                    {isEditingDoctor && <Button type="button" variant="ghost" size="icon" onClick={() => removeField(i)} className="text-zinc-400 hover:text-red-500 h-9 w-9"><Trash2 className="w-4 h-4" /></Button>}
                                                </div>
                                            ))}
                                            {additionalFields.length === 0 && <p className="text-xs text-center p-4 border border-dashed rounded-lg text-muted-foreground">No additional attributes added.</p>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-2">
                                        {isEditingDoctor ? (
                                            <>
                                                <Button type="button" variant="outline" className="h-11 px-8 bg-white" onClick={() => setIsEditingDoctor(false)}>Cancel</Button>
                                                <Button type="submit" className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700">Save Changes</Button>
                                            </>
                                        ) : (
                                            <Button type="button" className="h-11 px-8 bg-zinc-800 hover:bg-zinc-900" onClick={() => setIsEditingDoctor(true)}>Edit Doctor Profile</Button>
                                        )}
                                    </div>
                                </form>
                            </TabsContent>

                            {/* SERVICES */}
                            <TabsContent value="services" className="m-0 space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold">Services & Product Upsells</h3>
                                    <p className="text-sm text-muted-foreground">Manage the active billable services mapped to this specific clinic.</p>
                                </div>

                                <form action={async (formData) => {
                                    await createService({
                                        clinicId: activeClinic.id,
                                        name: formData.get("name") as string,
                                        price: Number(formData.get("price")),
                                        duration: Number(formData.get("duration")),
                                        isUpsell: formData.get("isUpsell") === "on"
                                    })
                                }} className="flex flex-col md:flex-row items-end gap-3 bg-zinc-50 p-6 rounded-xl border border-dashed shadow-inner">
                                    <div className="w-full md:flex-1 space-y-1.5"><Label className="text-xs font-semibold text-zinc-500 uppercase">New Service Target</Label><Input name="name" placeholder="e.g. Drug Screen" required className="bg-white" /></div>
                                    <div className="w-full md:w-28 space-y-1.5"><Label className="text-xs font-semibold text-zinc-500 uppercase">Price ($)</Label><Input name="price" type="number" step="0.01" required className="bg-white" /></div>
                                    <div className="w-full md:w-24 space-y-1.5"><Label className="text-xs font-semibold text-zinc-500 uppercase">Minutes</Label><Input name="duration" type="number" required className="bg-white" /></div>
                                    <div className="w-full md:w-auto flex items-center justify-between md:flex-col gap-2 p-3 border rounded-md bg-white">
                                        <Label className="text-[10px] uppercase text-zinc-400 font-bold whitespace-nowrap">Check-out Upsell?</Label>
                                        <Switch name="isUpsell" />
                                    </div>
                                    <Button type="submit" className="w-full md:w-auto bg-zinc-900 h-12 px-6"><PlusCircle className="w-4 h-4 mr-2" /> Add Record</Button>
                                </form>

                                <div className="space-y-0 rounded-xl border overflow-hidden shadow-sm">
                                    {activeClinic.services.map((service: any, idx: number) => (
                                        <div key={service.id} className={`flex flex-col md:flex-row md:items-center gap-4 p-5 ${idx !== 0 ? 'border-t' : ''} bg-white hover:bg-zinc-50/50 transition-colors`}>
                                            <form action={async (formData) => {
                                                await updateService(service.id, {
                                                    price: Number(formData.get("price")),
                                                    duration: Number(formData.get("duration"))
                                                })
                                            }} className="flex-1 grid grid-cols-1 md:grid-cols-4 items-end gap-4">
                                                <div className="md:col-span-2 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-lg font-medium">{service.name}</Label>
                                                        {service.isUpsell && <span className="text-[10px] h-5 font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 px-2 flex items-center rounded-full">Upsell</span>}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-zinc-400">Price</Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                                                        <Input name="price" defaultValue={String(service.price)} type="number" step="0.01" className="h-10 pl-7" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 items-end">
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-zinc-400">Mins</Label>
                                                        <Input name="duration" defaultValue={service.duration} type="number" className="h-10" />
                                                    </div>
                                                    <Button type="submit" size="sm" variant="outline" className="h-10 px-4">Update</Button>
                                                </div>
                                            </form>
                                            <form action={async () => {
                                                await deleteService(service.id)
                                            }}>
                                                <Button type="submit" size="icon" variant="ghost" className="h-10 w-10 text-zinc-300 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-5 h-5" /></Button>
                                            </form>
                                        </div>
                                    ))}
                                    {activeClinic.services.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground bg-zinc-50/20 italic">No service records provisioned yet.</div>}
                                </div>
                            </TabsContent>

                            {/* SCHEDULES */}
                            <TabsContent value="schedules" className="m-0 space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold">Operating Schedule</h3>
                                    <p className="text-sm text-muted-foreground">Define open routing layers for this clinic for the automated chronological matching algorithm.</p>
                                </div>
                                <form action={async (formData) => {
                                    await createSchedule({
                                        clinicId: activeClinic.id,
                                        dayOfWeek: Number(formData.get("dayOfWeek")),
                                        openTime: formData.get("openTime") as string,
                                        closeTime: formData.get("closeTime") as string
                                    })
                                }} className="flex flex-col md:flex-row items-end gap-3 bg-zinc-50 p-6 rounded-xl border border-dashed shadow-inner">
                                    <div className="w-full md:flex-1 space-y-1.5">
                                        <Label className="text-xs font-semibold text-zinc-500 uppercase">Day Target</Label>
                                        <Select name="dayOfWeek" defaultValue="1">
                                            <SelectTrigger className="bg-white h-11"><SelectValue placeholder="Day" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Monday</SelectItem>
                                                <SelectItem value="2">Tuesday</SelectItem>
                                                <SelectItem value="3">Wednesday</SelectItem>
                                                <SelectItem value="4">Thursday</SelectItem>
                                                <SelectItem value="5">Friday</SelectItem>
                                                <SelectItem value="6">Saturday</SelectItem>
                                                <SelectItem value="0">Sunday</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-full md:w-40 space-y-1.5"><Label className="text-xs font-semibold text-zinc-500 uppercase">Open Window</Label><Input name="openTime" type="time" step="900" required className="bg-white h-11" /></div>
                                    <div className="w-full md:w-40 space-y-1.5"><Label className="text-xs font-semibold text-zinc-500 uppercase">Close Window</Label><Input name="closeTime" type="time" step="900" required className="bg-white h-11" /></div>
                                    <Button type="submit" className="w-full md:w-auto bg-zinc-900 h-11 px-8 flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Map Day</Button>
                                </form>

                                <div className="space-y-0 rounded-xl border overflow-hidden shadow-sm">
                                    {[...activeClinic.schedules].sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek).map((schedule: any, idx: number) => (
                                        <div key={schedule.id} className={`flex flex-col md:flex-row md:items-center gap-4 p-5 ${idx !== 0 ? 'border-t' : ''} bg-white hover:bg-zinc-50 transition-colors`}>
                                            <div className="w-full md:w-40 font-bold text-zinc-800 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.dayOfWeek]}
                                            </div>
                                            <form action={async (formData) => {
                                                await updateSchedule(schedule.id, {
                                                    openTime: formData.get("openTime") as string,
                                                    closeTime: formData.get("closeTime") as string,
                                                    isActive: formData.get("isActive") === "on"
                                                })
                                            }} className="flex-1 flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-lg border">
                                                    <Input name="openTime" defaultValue={schedule.openTime} type="time" step="900" className="w-32 h-9 border-0 bg-transparent" />
                                                    <span className="text-zinc-400 font-bold">»</span>
                                                    <Input name="closeTime" defaultValue={schedule.closeTime} type="time" step="900" className="w-32 h-9 border-0 bg-transparent" />
                                                </div>
                                                <div className="flex items-center gap-3 px-4 h-11 rounded-lg border bg-zinc-50 shadow-sm">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-tighter">Status</Label>
                                                    <Switch name="isActive" defaultChecked={schedule.isActive} />
                                                </div>
                                                <Button type="submit" size="sm" variant="secondary" className="h-11 px-6 font-bold ml-auto shadow-sm">Save Changes</Button>
                                            </form>
                                            <form action={async () => {
                                                await deleteSchedule(schedule.id)
                                            }}>
                                                <Button type="submit" size="icon" variant="ghost" className="h-11 w-11 text-zinc-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></Button>
                                            </form>
                                        </div>
                                    ))}
                                    {activeClinic.schedules.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground bg-zinc-50/20 italic">No chronological schedules mapped.</div>}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            ) : null}
        </div>
    )
}

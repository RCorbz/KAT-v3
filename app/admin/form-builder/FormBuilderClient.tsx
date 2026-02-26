"use client"

import { useState } from "react"
import { createIntakeQuestion, updateIntakeQuestion, deleteIntakeQuestion, createIntakeForm, updateIntakeForm, deleteIntakeForm } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, PlusCircle, GripVertical, Save, Info, ArrowLeft, Layers } from "lucide-react"
import Link from "next/link"

type Question = any
type Form = any

export function FormBuilderClient({ questions, forms, activeFormId, activeForm, clinicId }: { questions: Question[], forms: Form[], activeFormId?: string, activeForm?: Form, clinicId: string }) {
    const [isAdding, setIsAdding] = useState(false)
    const [isAddingForm, setIsAddingForm] = useState(false)

    if (!activeFormId) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto pb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Intake Form Management</h1>
                        <p className="text-sm text-muted-foreground">Create and manage multiple specialized intake forms for different services.</p>
                    </div>
                    <Button onClick={() => setIsAddingForm(!isAddingForm)} className="bg-emerald-600 hover:bg-emerald-700">
                        <PlusCircle className="w-4 h-4 mr-2" /> Create New Form
                    </Button>
                </div>

                {isAddingForm && (
                    <Card className="border-emerald-200 bg-emerald-50/20">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase font-bold text-emerald-800">New Intake Form</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={async (formData) => {
                                const id = await createIntakeForm({
                                    name: formData.get("name") as string,
                                    description: formData.get("description") as string,
                                    clinicId: clinicId
                                })
                                setIsAddingForm(false)
                                window.location.href = `/admin/form-builder?formId=${id}`
                            }} className="grid gap-4 sm:grid-cols-2 items-end">
                                <div className="space-y-1.5">
                                    <Label>Form Name</Label>
                                    <Input name="name" placeholder="e.g. Emergency Intake" required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Description</Label>
                                    <Input name="description" placeholder="Short description of when this form is used" />
                                </div>
                                <Button type="submit" className="sm:col-span-2 bg-emerald-600 h-11">Create Form & Start Adding Questions</Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    {forms.map(f => (
                        <Card key={f.id} className="hover:border-emerald-200 transition-colors cursor-pointer group relative">
                            <Link href={`/admin/form-builder?formId=${f.id}`} className="absolute inset-0 z-0" />
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{f.name}</CardTitle>
                                    <Layers className="w-5 h-5 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{f.description || "No description provided."}</p>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${f.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                        {f.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <div className="flex gap-2 relative z-10">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-red-500" onClick={async (e) => {
                                            e.preventDefault()
                                            if (confirm("Delete this form and all its questions?")) await deleteIntakeForm(f.id)
                                        }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {forms.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-zinc-50">
                        <div className="flex flex-col items-center gap-3">
                            <Info className="w-10 h-10 text-zinc-300" />
                            <p className="text-muted-foreground">No intake forms created yet.</p>
                            <Button onClick={() => setIsAddingForm(true)} variant="outline">Create your first form</Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/form-builder">
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{activeForm?.name}</h1>
                        <p className="text-sm text-muted-foreground">Editing questions for this specific intake form.</p>
                    </div>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} className="bg-emerald-600 hover:bg-emerald-700">
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Question
                </Button>
            </div>

            {isAdding && (
                <Card className="border-emerald-200 bg-emerald-50/20">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase font-bold text-emerald-800">New Screening Question</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={async (formData) => {
                            await createIntakeQuestion({
                                formId: activeFormId,
                                text: formData.get("text") as string,
                                type: formData.get("type") as string,
                                order: Number(formData.get("order") || 0)
                            })
                            setIsAdding(false)
                        }} className="grid gap-4 sm:grid-cols-4 items-end">
                            <div className="sm:col-span-3 space-y-1.5">
                                <Label>Question Text</Label>
                                <Input name="text" placeholder="Do you use CPAP?" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Type</Label>
                                <Select name="type" defaultValue="boolean">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="boolean">Yes / No</SelectItem>
                                        <SelectItem value="text">Short Text</SelectItem>
                                        <SelectItem value="select">Dropdown</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="sm:col-span-4 bg-emerald-600 h-11">Save New Question</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {questions.map((q) => (
                    <Card key={q.id} className="group hover:border-emerald-200 transition-colors">
                        <CardContent className="p-4 flex items-center gap-4">
                            <GripVertical className="text-zinc-300 group-hover:text-emerald-400" />

                            <form action={async (formData) => {
                                await updateIntakeQuestion(q.id, {
                                    text: formData.get("text") as string,
                                    type: formData.get("type") as string,
                                    order: Number(formData.get("order")),
                                    isActive: formData.get("isActive") === "on"
                                })
                            }} className="flex-1 grid gap-4 sm:grid-cols-12 items-end">
                                <div className="sm:col-span-12 md:col-span-7 space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-400">Display Text</Label>
                                    <Input name="text" defaultValue={q.text} className="h-9" />
                                </div>
                                <div className="sm:col-span-6 md:col-span-2 space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-400">Type</Label>
                                    <Select name="type" defaultValue={q.type}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="boolean">Yes/No</SelectItem>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="select">Select</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="sm:col-span-6 md:col-span-1 space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-400">Order</Label>
                                    <Input name="order" type="number" defaultValue={q.order} className="h-9" />
                                </div>
                                <div className="sm:col-span-6 md:col-span-1 flex flex-col items-center gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-400">Active</Label>
                                    <Switch name="isActive" defaultChecked={q.isActive} />
                                </div>

                                <div className="sm:col-span-12 md:col-span-1 flex gap-2">
                                    <Button type="submit" size="icon" variant="ghost" className="h-9 w-9 text-emerald-600 hover:bg-emerald-50"><Save className="w-4 h-4" /></Button>
                                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-zinc-300 hover:text-red-500 hover:bg-red-50" onClick={async () => {
                                        if (confirm("Delete this question?")) await deleteIntakeQuestion(q.id)
                                    }}><Trash2 className="w-4 h-4" /></Button>
                                </div>

                                {q.type === 'select' && (
                                    <div className="sm:col-span-12 mt-2 pt-3 border-t border-zinc-50">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-400 mb-2 block">Dropdown Options</Label>
                                        <OptionsManager
                                            initialOptions={q.options || []}
                                            onSave={async (options) => {
                                                await updateIntakeQuestion(q.id, { options })
                                            }}
                                        />
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                ))}

                {questions.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-zinc-50">
                        <div className="flex flex-col items-center gap-3">
                            <Info className="w-10 h-10 text-zinc-300" />
                            <p className="text-muted-foreground">No screening questions configured.</p>
                            <Button onClick={() => setIsAdding(true)} variant="outline">Create your first question</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function OptionsManager({ initialOptions, onSave }: { initialOptions: string[], onSave: (options: string[]) => Promise<void> }) {
    const [options, setOptions] = useState<string[]>(initialOptions)
    const [isSaving, setIsSaving] = useState(false)

    const addOption = () => setOptions([...options, ""])
    const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index))
    const updateOption = (index: number, value: string) => {
        const next = [...options]
        next[index] = value
        setOptions(next)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(options.filter(o => o.trim() !== ""))
        } finally {
            setIsSaving(false)
        }
    }

    const hasChanges = JSON.stringify(options) !== JSON.stringify(initialOptions)

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-1 bg-white border rounded-md p-1 pr-2 shadow-sm">
                        <Input
                            value={opt}
                            onChange={(e) => updateOption(i, e.target.value)}
                            placeholder="Option label"
                            className="h-7 border-0 focus-visible:ring-0 min-w-[120px] text-xs font-bold"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(i)}
                            className="h-5 w-5 text-zinc-400 hover:text-red-500"
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="h-9 border-dashed text-zinc-500"
                >
                    <PlusCircle className="w-3 h-3 mr-1" /> Add Option
                </Button>
            </div>
            {hasChanges && (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-emerald-600 h-8"
                    >
                        {isSaving ? "Saving..." : "Save Options"}
                    </Button>
                </div>
            )}
        </div>
    )
}

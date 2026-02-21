"use client"

import { useState } from "react"
import { createIntakeQuestion, updateIntakeQuestion, deleteIntakeQuestion } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, PlusCircle, GripVertical, Save, Info } from "lucide-react"

type Question = any

export function FormBuilderClient({ questions }: { questions: Question[] }) {
    const [isAdding, setIsAdding] = useState(false)

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Medical Form Builder</h1>
                    <p className="text-sm text-muted-foreground">Manage the active medical screening questions for the intake funnel.</p>
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
                                text: formData.get("text") as string,
                                jsonKey: formData.get("jsonKey") as string,
                                type: formData.get("type") as string,
                                order: Number(formData.get("order") || 0)
                            })
                            setIsAdding(false)
                        }} className="grid gap-4 sm:grid-cols-4 items-end">
                            <div className="sm:col-span-2 space-y-1.5">
                                <Label>Question Text</Label>
                                <Input name="text" placeholder="Do you use CPAP?" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Data Key (Unique)</Label>
                                <Input name="jsonKey" placeholder="hasCpap" required />
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
                                    jsonKey: formData.get("jsonKey") as string,
                                    type: formData.get("type") as string,
                                    order: Number(formData.get("order")),
                                    isActive: formData.get("isActive") === "on"
                                })
                            }} className="flex-1 grid gap-4 sm:grid-cols-12 items-end">
                                <div className="sm:col-span-12 md:col-span-5 space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-400">Display Text</Label>
                                    <Input name="text" defaultValue={q.text} className="h-9" />
                                </div>
                                <div className="sm:col-span-6 md:col-span-2 space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-400">JSON Key</Label>
                                    <Input name="jsonKey" defaultValue={q.jsonKey} className="h-9 bg-zinc-50 font-mono text-xs" />
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

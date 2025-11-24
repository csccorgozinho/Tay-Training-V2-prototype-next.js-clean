import React, { useEffect, useState } from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

// CLEANUP: Added interface for User profile data
interface UserProfile {
  email: string
  name: string
}

// CLEANUP: Added interface for form state and errors
type FormErrors = Partial<Record<keyof UserProfile, string>>

export default function ProfileDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  // CLEANUP: Typed form state with UserProfile interface for better type safety
  const [form, setForm] = useState<UserProfile>({
    email: '',
    name: '',
  })
  // CLEANUP: Added proper error typing instead of Record<string, string>
  const [errors, setErrors] = useState<FormErrors>({})
  const { toast } = useToast()

  // CLEANUP: Extracted profile fetch into separate function for reusability
  const fetchProfile = async (): Promise<void> => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      if (data?.user) {
        setForm((prev) => ({
          ...prev,
          email: data.user.email || '',
          name: data.user.name || '',
        }))
      } else {
        toast({ title: 'Erro', description: 'Não foi possível carregar os dados do perfil.' })
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar perfil.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchProfile()
  }, [open, toast])

  // CLEANUP: Improved validation function with better type safety
  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // CLEANUP: Improved form submission with better error handling
  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      // CLEANUP: Build update payload with explicit typed structure
      const updatePayload: Partial<UserProfile> = {
        name: form.name,
      }
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json?.message || 'Erro ao atualizar')
      toast({ title: 'Perfil atualizado', description: 'Suas informações foram salvas.' })
      setOpen(false)
    } catch (err) {
      // CLEANUP: Improved error handling with type-safe error extraction
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar.'
      toast({ title: 'Erro', description: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full text-left">
          Perfil
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Perfil</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email - Read Only */}
          <div>
            <Label className="text-sm">Email</Label>
            <Input value={form.email} disabled className="bg-muted cursor-not-allowed" />
            <p className="text-xs text-muted-foreground mt-1">Não é possível alterar o email</p>
          </div>

          {/* Name */}
          <div>
            <Label className="text-sm">Nome</Label>
            <Input 
              value={form.name} 
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} 
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)} type="button">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

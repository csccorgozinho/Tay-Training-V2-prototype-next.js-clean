import { useState } from 'react'
import { useRouter } from 'next/router'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export const LoginForm = () => {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  function validateField(name: string, value: string): void {
    setErrors((prev) => {
      const next = { ...prev }
      if (name === 'email') {
        if (!value) next.email = 'Email é obrigatório'
        else if (!emailRegex.test(value)) next.email = 'Email inválido'
        else delete next.email
      } else if (name === 'password') {
        if (!value) next.password = 'Senha é obrigatória'
        else if (value.length < 8) next.password = 'A senha deve ter ao menos 8 caracteres'
        else delete next.password
      }
      return next
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    validateField('email', formData.email)
    validateField('password', formData.password)

    if (Object.keys(errors).length > 0) {
      toast({ variant: 'destructive', title: 'Corrija os erros do formulário' })
      return
    }

    setIsLoading(true)
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      })

      if (res?.ok) {
        toast({ title: 'Login bem-sucedido!', description: 'Redirecionando...' })
        setTimeout(() => router.push('/home'), 700)
      } else {
        toast({ variant: 'destructive', title: 'Falha no login', description: res?.error || 'Credenciais inválidas' })
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao tentar autenticar' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* EMAIL */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Digite seu email"
              value={formData.email}
              onChange={handleChange}
              required
              className="h-12"
            />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Button
                variant="link"
                className="px-0 font-normal text-xs text-primary"
                type="button"
                onClick={() => router.push('/forgot-password')}
              >
                Esqueceu a senha?
              </Button>
            </div>

            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-12 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className={cn('w-full h-12 text-base font-medium transition-all duration-300', isLoading ? 'bg-primary/80' : 'bg-primary hover:bg-primary/90')}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full" />
              Entrando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Entrar
            </div>
          )}
        </Button>
      </form>
    </div>
  )
}

export default LoginForm

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema'
import styles from './LoginForm.module.css'

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>
  /** Authentication failure or session notice shown above the fields. */
  formError: string | null
}

export function LoginForm({ onSubmit, formError }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      aria-describedby={formError ? 'login-error' : undefined}
    >
      {formError && (
        <p id="login-error" className={styles.formError} role="alert">
          <Icon name="alert" size={16} />
          {formError}
        </p>
      )}

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Log In <span aria-hidden="true">*</span>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder="name@company.com"
          className={styles.input}
          aria-required="true"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className={styles.fieldError}>
            {errors.email.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Password <span aria-hidden="true">*</span>
        </label>
        <div className={styles.passwordWrap}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={styles.input}
            aria-required="true"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          <button
            type="button"
            className={styles.toggle}
            onClick={() => {
              setShowPassword((v) => !v)
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            aria-controls="password"
          >
            <Icon name={showPassword ? 'eyeOff' : 'eye'} />
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className={styles.fieldError}>
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" variant="primary" className={styles.submit} loading={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Login'}
      </Button>
    </form>
  )
}

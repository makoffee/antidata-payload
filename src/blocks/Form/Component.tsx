'use client'
import type { FormFieldBlock, Form as FormType } from '@payloadcms/plugin-form-builder/types'

import { ArrowLeft, CircleCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import RichText from '@/components/RichText'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/utilities/ui'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import { fields } from './fields'
import { DotMatrixSpinner } from '@/components/DotMatrixSpinner'
import { Turnstile } from './Turnstile'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export type FormBlockType = {
  blockName?: string
  blockType?: 'formBlock'
  enableIntro: boolean
  form: FormType
  introContent?: DefaultTypedEditorState
}

export const FormBlock: React.FC<
  {
    id?: string
  } & FormBlockType
> = (props) => {
  const {
    enableIntro,
    form: formFromProps,
    form: { id: formID, confirmationMessage, confirmationType, redirect, submitButtonLabel } = {},
    introContent,
  } = props

  const formMethods = useForm({
    defaultValues: formFromProps.fields,
    // Validate as the visitor types, so the submit button knows when the form is complete
    mode: 'onChange',
  })
  const {
    control,
    formState: { errors, isValid },
    handleSubmit,
    register,
  } = formMethods

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string } | undefined>()
  const router = useRouter()
  const successRef = useRef<HTMLDivElement>(null)

  // Anti-spam: a signed page-load token, a honeypot field, and the Turnstile check.
  const pageToken = useRef<string | undefined>(undefined)
  const honeypot = useRef<HTMLInputElement>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReset, setTurnstileReset] = useState(0)
  // GDPR consent: unticked by default, must be ticked to send
  const [consent, setConsent] = useState(false)
  const [consentMissing, setConsentMissing] = useState(false)

  // The button stays disabled until the required fields are valid, the box is ticked, and (when
  // enabled) the spam check has finished
  const canSubmit = isValid && consent && (!TURNSTILE_SITE_KEY || Boolean(turnstileToken))

  const loadToken = useCallback(async (): Promise<string | undefined> => {
    try {
      const res = await fetch('/next/contact/token', { cache: 'no-store' })
      const json = (await res.json()) as { token?: string }
      pageToken.current = json.token
    } catch {
      pageToken.current = undefined
    }
    return pageToken.current
  }, [])

  useEffect(() => {
    void loadToken()
  }, [loadToken])

  // Move focus to the confirmation so screen readers announce it
  useEffect(() => {
    if (hasSubmitted) {
      // The confirmation replaces the form in the same card, so the page should not jump
      successRef.current?.focus({ preventScroll: true })
      successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [hasSubmitted])

  const onSubmit = useCallback(
    (data: FormFieldBlock[]) => {
      const submitForm = async () => {
        setError(undefined)

        if (!consent) {
          setConsentMissing(true)
          return
        }

        if (TURNSTILE_SITE_KEY && !turnstileToken) {
          setError({
            message: 'Please wait a moment for the spam check to finish, then try again.',
          })
          return
        }

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }))

        // Lock the button straight away so a double click cannot send twice
        setIsSubmitting(true)

        try {
          const req = await fetch('/next/contact', {
            body: JSON.stringify({
              consent: true,
              form: formID,
              submissionData: dataToSend,
              token: pageToken.current ?? (await loadToken()),
              turnstileToken,
              website: honeypot.current?.value ?? '',
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })

          const res = (await req.json()) as { code?: string; message?: string }

          if (req.status >= 400) {
            setIsSubmitting(false)
            setError({ message: res.message || 'Something went wrong. Please try again later.' })

            // Tokens work once: get fresh ones for the next attempt
            if (res.code === 'token') void loadToken()
            setTurnstileToken(null)
            setTurnstileReset((n) => n + 1)

            return
          }

          setIsSubmitting(false)
          setHasSubmitted(true)

          if (confirmationType === 'redirect' && redirect?.url) router.push(redirect.url)
        } catch (err) {
          console.warn(err)
          setIsSubmitting(false)
          setError({ message: 'Something went wrong. Please check your connection and try again.' })
        }
      }

      void submitForm()
    },
    [router, formID, redirect, confirmationType, turnstileToken, loadToken, consent],
  )

  return (
    // Rule of thirds, like the rest of the site: on large screens the intro takes the left third
    // and the form the right two thirds (same 12-column gap as the Content block). Below that it is one full-width column.
    <div className="container mb-16">
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-3">
        {enableIntro && introContent && (
          <div className="lg:col-span-1">
            <RichText data={introContent} enableGutter={false} />
          </div>
        )}

        {/* Same frosted card as the call-to-action block, around both the form and the confirmation */}
        <div className="lg:col-span-2 lg:col-start-2">
          <div className="rounded-lg border border-white/60 bg-white/65 p-5 text-card-foreground shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/45 sm:p-6 md:p-8">
            <FormProvider {...formMethods}>
              {hasSubmitted && confirmationType === 'message' && (
                <div
                  aria-live="polite"
                  className="outline-none"
                  ref={successRef}
                  role="status"
                  tabIndex={-1}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <CircleCheck aria-hidden="true" className="size-8 shrink-0 text-brand" />
                    <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
                      Message sent
                    </h2>
                  </div>
                  {confirmationMessage && (
                    <RichText
                      className="text-muted-foreground [&_*]:font-normal"
                      data={confirmationMessage}
                      enableGutter={false}
                    />
                  )}

                  {/* Not a dead end: somewhere useful to go next */}
                  <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center">
                    <Link
                      className={cn(buttonVariants({ size: 'lg', variant: 'default' }))}
                      href="/"
                    >
                      <ArrowLeft aria-hidden="true" />
                      Back
                    </Link>
                    <Link
                      className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
                      href="/portfolio"
                    >
                      See my work
                    </Link>
                  </div>
                </div>
              )}

              {!hasSubmitted && (
                <form id={formID} noValidate onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-6">
                    {formFromProps &&
                      formFromProps.fields &&
                      formFromProps.fields?.map((field, index) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const Field: React.FC<any> =
                          fields?.[field.blockType as keyof typeof fields]
                        if (Field) {
                          return (
                            <div className="mb-6 last:mb-0" key={index}>
                              <Field
                                form={formFromProps}
                                {...field}
                                {...formMethods}
                                control={control}
                                errors={errors}
                                register={register}
                              />
                            </div>
                          )
                        }
                        return null
                      })}
                  </div>

                  {/* Honeypot: invisible to people, tempting to bots. Anything typed here is dropped. */}
                  <div
                    aria-hidden="true"
                    className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                  >
                    <label htmlFor={`${formID}-website`}>Leave this field empty</label>
                    <input
                      autoComplete="off"
                      id={`${formID}-website`}
                      name="website"
                      ref={honeypot}
                      tabIndex={-1}
                      type="text"
                    />
                  </div>

                  <div className="mb-6">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        aria-describedby={consentMissing ? 'consent-error' : undefined}
                        aria-invalid={consentMissing}
                        checked={consent}
                        className="mt-0.5 size-5"
                        id={`${formID}-consent`}
                        onCheckedChange={(checked) => {
                          setConsent(checked === true)
                          if (checked === true) setConsentMissing(false)
                        }}
                      />
                      <Label
                        className="text-sm font-normal leading-snug text-muted-foreground"
                        htmlFor={`${formID}-consent`}
                      >
                        <span className="required">
                          * <span className="sr-only">(required)</span>
                        </span>
                        I agree to this use of my name and email address.
                      </Label>
                    </div>
                    {consentMissing && (
                      <div className="mt-2 text-sm text-red-500" id="consent-error" role="alert">
                        Please tick the box to send your message.
                      </div>
                    )}
                  </div>

                  {TURNSTILE_SITE_KEY && (
                    <Turnstile
                      onToken={setTurnstileToken}
                      resetKey={turnstileReset}
                      siteKey={TURNSTILE_SITE_KEY}
                    />
                  )}

                  {error && (
                    <div
                      className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
                      role="alert"
                    >
                      {error.message}
                    </div>
                  )}

                  <Button
                    className={cn(
                      'w-full border transition-[background-color,color,border-color,box-shadow] duration-300 ease-out disabled:opacity-100 sm:w-auto sm:min-w-48',
                      canSubmit
                        ? // Ready: black with brand text in light mode, brand with dark text in dark mode
                          'border-transparent bg-black text-brand hover:bg-black/85 dark:bg-brand dark:text-brand-foreground dark:hover:bg-brand/90'
                        : // Not ready: quiet outline with muted text
                          'border-foreground/25 bg-transparent text-muted-foreground shadow-none',
                      isSubmitting && 'opacity-70',
                    )}
                    disabled={isSubmitting || !canSubmit}
                    form={formID}
                    size="lg"
                    type="submit"
                    variant="default"
                  >
                    {/* The spinner slot grows from nothing and the two labels cross-fade in the same spot, so the
                        button never jumps when sending starts or fails */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'inline-flex shrink-0 overflow-hidden transition-[width,margin,opacity] duration-300 ease-out',
                        isSubmitting ? 'w-6 opacity-100' : '-mr-2 w-0 opacity-0',
                      )}
                    >
                      <DotMatrixSpinner
                        className={cn(
                          'size-6 shrink-0',
                          !isSubmitting && '[&_.dot-spinner-lit]:[animation-play-state:paused]',
                        )}
                      />
                    </span>
                    <span className="grid">
                      <span
                        aria-hidden={isSubmitting}
                        className={cn(
                          'col-start-1 row-start-1 transition-opacity duration-300 ease-out',
                          isSubmitting && 'opacity-0',
                        )}
                      >
                        {submitButtonLabel}
                      </span>
                      <span
                        aria-hidden={!isSubmitting}
                        className={cn(
                          'col-start-1 row-start-1 transition-opacity duration-300 ease-out',
                          !isSubmitting && 'opacity-0',
                        )}
                      >
                        Sending…
                      </span>
                    </span>
                  </Button>
                </form>
              )}
            </FormProvider>
          </div>

          {/* Full privacy wording, under the card so it does not push the submit button down */}
          {!hasSubmitted && (
            <p className="mt-4 text-sm text-muted-foreground">
              If you send a message, antidata.net stores your name and email address to reply to you
              and to contact you about new projects and services. You can withdraw your consent at
              any time. See{' '}
              <Link className="underline underline-offset-4" href="/data-protection">
                Data Protection
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'
import type { FormFieldBlock, Form as FormType } from '@payloadcms/plugin-form-builder/types'

import { ArrowRight, CircleCheck } from 'lucide-react'
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
  })
  const {
    control,
    formState: { errors },
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

  // Move focus to the confirmation so screen readers announce it and the visitor sees it
  useEffect(() => {
    if (hasSubmitted) {
      successRef.current?.focus()
      successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
          setError({ message: 'Please wait a moment for the spam check to finish, then try again.' })
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
    <div className="container my-16">
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-3">
        {enableIntro && introContent && !hasSubmitted && (
          <div className="lg:col-span-1">
            <RichText data={introContent} enableGutter={false} />
          </div>
        )}

        <div className="lg:col-span-2 lg:col-start-2">
          <FormProvider {...formMethods}>
            {hasSubmitted && confirmationType === 'message' && (
              <div
                aria-live="polite"
                className="outline-none"
                ref={successRef}
                role="status"
                tabIndex={-1}
              >
                <CircleCheck aria-hidden="true" className="mb-4 size-10 text-brand" />
                <h2 className="mb-4 text-2xl font-medium tracking-tight md:text-3xl">
                  Message sent
                </h2>
                {confirmationMessage && <RichText data={confirmationMessage} enableGutter={false} />}

                {/* Not a dead end: somewhere useful to go next */}
                <div className="mt-10 border-t border-border pt-8">
                  <p className="mb-4 text-sm text-muted-foreground">While you are here</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      className={cn(buttonVariants({ size: 'lg', variant: 'default' }))}
                      href="/portfolio"
                    >
                      See the case studies
                      <ArrowRight aria-hidden="true" />
                    </Link>
                    <Link
                      className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
                      href="/"
                    >
                      Back to the home page
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {!hasSubmitted && (
              <form id={formID} noValidate onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-8">
                  {formFromProps &&
                    formFromProps.fields &&
                    formFromProps.fields?.map((field, index) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
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
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
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

                <div className="mb-8">
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
                      I agree that antidata.net may store my name and email address to reply to my
                      message and to contact me about new projects and services. I can withdraw my
                      consent at any time. See{' '}
                      <Link className="underline underline-offset-4" href="/data-protection">
                        Data Protection
                      </Link>
                      .
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
                  className="w-full sm:w-auto sm:min-w-48"
                  disabled={isSubmitting}
                  form={formID}
                  size="lg"
                  type="submit"
                  variant="default"
                >
                  {isSubmitting ? 'Sending…' : submitButtonLabel}
                </Button>
              </form>
            )}
          </FormProvider>
        </div>
      </div>
    </div>
  )
}

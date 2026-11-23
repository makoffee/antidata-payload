'use client'
import type { FormFieldBlock, Form as FormType } from '@payloadcms/plugin-form-builder/types'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
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

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()
  const router = useRouter()

  // Anti-spam: a signed page-load token, a honeypot field, and the Turnstile check.
  const pageToken = useRef<string | undefined>(undefined)
  const honeypot = useRef<HTMLInputElement>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileReset, setTurnstileReset] = useState(0)

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

  const onSubmit = useCallback(
    (data: FormFieldBlock[]) => {
      let loadingTimerID: ReturnType<typeof setTimeout>
      const submitForm = async () => {
        setError(undefined)

        if (TURNSTILE_SITE_KEY && !turnstileToken) {
          setError({ message: 'Please wait a moment for the spam check to finish, then try again.' })
          return
        }

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }))

        // delay loading indicator by 1s
        loadingTimerID = setTimeout(() => {
          setIsLoading(true)
        }, 1000)

        try {
          const req = await fetch('/next/contact', {
            body: JSON.stringify({
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

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)

            setError({ message: res.message || 'Something went wrong. Please try again later.' })

            // Tokens work once: get fresh ones for the next attempt
            if (res.code === 'token') void loadToken()
            setTurnstileToken(null)
            setTurnstileReset((n) => n + 1)

            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (confirmationType === 'redirect' && redirect) {
            const { url } = redirect

            const redirectUrl = url

            if (redirectUrl) router.push(redirectUrl)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: 'Something went wrong.',
          })
        }
      }

      void submitForm()
    },
    [router, formID, redirect, confirmationType, turnstileToken, loadToken],
  )

  return (
    <div className="container lg:max-w-[48rem]">
      {enableIntro && introContent && !hasSubmitted && (
        <RichText className="mb-8 lg:mb-12" data={introContent} enableGutter={false} />
      )}
      <div className="p-4 lg:p-6 border border-border rounded-[0.8rem]">
        <FormProvider {...formMethods}>
          {!isLoading && hasSubmitted && confirmationType === 'message' && (
            <RichText data={confirmationMessage} />
          )}
          {isLoading && !hasSubmitted && <p>Loading, please wait...</p>}
          {error && (
            <div className="mb-4" role="alert">
              {error.message}
            </div>
          )}
          {!hasSubmitted && (
            <form id={formID} onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4 last:mb-0">
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

              {TURNSTILE_SITE_KEY && (
                <Turnstile
                  onToken={setTurnstileToken}
                  resetKey={turnstileReset}
                  siteKey={TURNSTILE_SITE_KEY}
                />
              )}

              <Button className="mt-6" form={formID} type="submit" variant="default">
                {submitButtonLabel}
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Your message is used only to reply to you and is deleted after 12 months. See{' '}
                <Link className="underline underline-offset-4" href="/data-protection">
                  Data Protection
                </Link>
                .
              </p>
            </form>
          )}
        </FormProvider>
      </div>
    </div>
  )
}

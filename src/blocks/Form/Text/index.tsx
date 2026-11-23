import type { TextField } from '@payloadcms/plugin-form-builder/types'
import type { FieldErrorsImpl, FieldValues, UseFormRegister } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React from 'react'

import { Error } from '../Error'
import { Width } from '../Width'

export const Text: React.FC<
  TextField & {
    errors: Partial<FieldErrorsImpl>
    register: UseFormRegister<FieldValues>
  }
> = ({ name, defaultValue, errors, label, register, required, width }) => {
  return (
    <Width width={width}>
      <Label htmlFor={name}>
        {label}

        {required && (
          <span className="required">
            * <span className="sr-only">(required)</span>
          </span>
        )}
      </Label>
      <Input
        autoComplete={/name/i.test(name) ? 'name' : undefined}
        className="mt-2 h-12 md:text-base"
        defaultValue={defaultValue}
        id={name}
        type="text"
        {...register(name, { required: required ? `${label || 'This field'} is required` : false })}
      />
      {errors[name] && <Error name={name} />}
    </Width>
  )
}

/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useTranslation } from 'react-i18next'

import { Card, CardContent } from '@/components/ui/card'

import { parsePlainHomeHero } from './custom-home-content-parser'

interface CustomHomeContentProps {
  content: string
}

export function CustomHomeContent(props: CustomHomeContentProps) {
  const { t } = useTranslation()
  const lines = parsePlainHomeHero(props.content)

  if (!lines) {
    return null
  }

  return (
    <section className='relative isolate overflow-hidden px-6 pt-32 pb-24 md:pt-40 md:pb-32'>
      <div
        aria-hidden='true'
        className='bg-primary/10 pointer-events-none absolute top-24 left-1/2 -z-10 size-56 -translate-x-[140%] rounded-full blur-3xl'
      />
      <div
        aria-hidden='true'
        className='bg-chart-2/10 pointer-events-none absolute top-16 left-1/2 -z-10 size-64 translate-x-[35%] rounded-full blur-3xl'
      />
      <Card className='relative mx-auto max-w-5xl py-14 shadow-xl md:py-20'>
        <CardContent className='flex flex-col items-center px-8 text-center md:px-14'>
          <div className='mb-8 flex items-center justify-center gap-4 md:mb-10'>
            <span aria-hidden='true' className='bg-border h-px w-10' />
            <span className='text-muted-foreground text-[11px] font-medium tracking-[0.35em] uppercase'>
              {t('Internal Gateway')}
            </span>
            <span aria-hidden='true' className='bg-border h-px w-10' />
          </div>
          <h1 className='text-foreground max-w-3xl text-[clamp(2.4rem,6vw,4.8rem)] leading-[0.98] font-semibold tracking-[-0.04em] text-balance'>
            {lines[0]}
          </h1>
          {lines[1] ? (
            <p className='text-muted-foreground mt-6 max-w-2xl text-[1.05rem] leading-8 md:text-[1.18rem]'>
              {lines[1]}
            </p>
          ) : null}
          {lines[2] ? (
            <p className='text-muted-foreground/80 mt-3 max-w-2xl text-sm leading-7 md:text-base'>
              {lines[2]}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

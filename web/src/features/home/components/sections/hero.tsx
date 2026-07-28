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
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
  title?: string
  description?: string
}

function EasyBlueprint(props: { label: string }) {
  return (
    <div
      role='img'
      aria-label={props.label}
      className='easy-blueprint relative mx-auto aspect-[1.02] w-full max-w-[38rem]'
    >
      <div aria-hidden='true' className='absolute inset-0'>
        <div className='easy-blueprint-glow absolute inset-[18%] rounded-full' />

        <svg
          viewBox='0 0 680 660'
          fill='none'
          className='absolute inset-0 size-full'
          xmlns='http://www.w3.org/2000/svg'
        >
          <defs>
            <linearGradient id='easy-route' x1='75' y1='140' x2='615' y2='530'>
              <stop stopColor='#0A5BFF' stopOpacity='0.08' />
              <stop offset='0.48' stopColor='#087CFA' stopOpacity='0.72' />
              <stop offset='1' stopColor='#53B8FF' stopOpacity='0.12' />
            </linearGradient>
            <linearGradient id='easy-ring' x1='150' y1='95' x2='560' y2='580'>
              <stop stopColor='#0057FF' stopOpacity='0.85' />
              <stop offset='1' stopColor='#7ED3FF' stopOpacity='0.2' />
            </linearGradient>
          </defs>

          <circle
            cx='340'
            cy='330'
            r='242'
            stroke='#1379FF'
            strokeOpacity='0.1'
          />
          <circle
            cx='340'
            cy='330'
            r='206'
            stroke='url(#easy-ring)'
            strokeWidth='1.5'
            strokeDasharray='3 12'
            className='easy-dash-flow'
          />
          <circle
            cx='340'
            cy='330'
            r='166'
            stroke='#0A67F5'
            strokeOpacity='0.2'
            strokeDasharray='1 8'
          />

          <path
            d='M38 168C142 168 165 244 246 244H448C520 244 538 188 642 188'
            stroke='url(#easy-route)'
            strokeWidth='1.5'
            strokeDasharray='6 9'
            className='easy-route-flow'
          />
          <path
            d='M54 488C156 488 174 414 256 414H438C523 414 539 474 626 474'
            stroke='url(#easy-route)'
            strokeWidth='1.5'
            strokeDasharray='2 11'
            className='easy-route-flow easy-route-flow-reverse'
          />
          <path
            d='M102 92V134H154M580 568V526H528'
            stroke='#0A67F5'
            strokeOpacity='0.28'
            strokeDasharray='4 7'
          />

          <g fill='#FFFFFF' stroke='#0876F9' strokeWidth='1.5'>
            <circle cx='38' cy='168' r='5' />
            <circle cx='642' cy='188' r='5' />
            <circle cx='54' cy='488' r='5' />
            <circle cx='626' cy='474' r='5' />
          </g>
          <g fill='#0876F9'>
            <circle cx='246' cy='244' r='3' />
            <circle cx='448' cy='244' r='3' />
            <circle cx='256' cy='414' r='3' />
            <circle cx='438' cy='414' r='3' />
          </g>
        </svg>

        <div className='absolute top-[11%] left-[2%] rounded-full border border-dashed border-[#0A67F5]/25 bg-white/85 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-[#075DCE] uppercase backdrop-blur-sm sm:text-[10px]'>
          request / 001
        </div>
        <div className='absolute top-[15%] right-[1%] flex items-center gap-2 rounded-full border border-[#0A67F5]/15 bg-white/90 px-3 py-1.5 font-mono text-[9px] text-[#075DCE] shadow-[0_12px_35px_-20px_rgba(0,87,255,0.55)] backdrop-blur-sm sm:text-[10px]'>
          <span className='size-1.5 rounded-full bg-[#0A67F5]' />
          200 OK · 24 ms
        </div>

        <div className='absolute inset-x-0 top-[23%] flex flex-col items-center leading-none select-none'>
          <span className='easy-outline-word easy-outline-word-ghost -mb-[0.2em] translate-x-[0.06em]'>
            简单
          </span>
          <span className='easy-outline-word'>简单</span>
          <span className='easy-outline-latin -mt-[0.12em]'>easy</span>
          <span className='easy-outline-latin easy-outline-word-ghost -mt-[0.82em] -translate-x-[0.04em]'>
            easy
          </span>
        </div>

        <div className='absolute bottom-[14%] left-[4%] rounded-2xl border border-[#0A67F5]/15 bg-white/90 px-4 py-3 shadow-[0_18px_50px_-28px_rgba(0,87,255,0.65)] backdrop-blur-sm'>
          <p className='font-mono text-[8px] tracking-[0.2em] text-[#3F75B9] uppercase'>
            one endpoint
          </p>
          <p className='mt-1.5 font-mono text-[10px] font-medium text-[#075DCE] sm:text-xs'>
            /v1/chat/completions
          </p>
        </div>
      </div>
    </div>
  )
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()

  return (
    <section className='relative min-h-[42rem] overflow-hidden border-b border-[#0A67F5]/10 px-5 pt-20 pb-10 sm:px-6 md:pt-24 md:pb-16'>
      <div aria-hidden='true' className='easy-hero-grid absolute inset-0' />
      <div
        aria-hidden='true'
        className='absolute top-24 left-[7%] font-mono text-[9px] tracking-[0.28em] text-[#0A67F5]/35 uppercase'
      >
        37.5665° N / 122.2605° W
      </div>
      <div
        aria-hidden='true'
        className='absolute top-1/2 -right-11 hidden rotate-90 font-mono text-[9px] tracking-[0.3em] text-[#0A67F5]/30 uppercase lg:block'
      >
        unified intelligence interface
      </div>

      <div className='relative mx-auto grid max-w-7xl items-center gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-0'>
        <div className='relative z-10 max-w-xl'>
          <div className='landing-animate-fade-up mb-7 inline-flex items-center gap-2 rounded-full border border-dashed border-[#0A67F5]/30 bg-[#F7FBFF] px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-[#075DCE] uppercase [animation-delay:0ms]'>
            <span className='relative flex size-1.5'>
              <span className='absolute inline-flex size-full animate-ping rounded-full bg-[#1687FF] opacity-50' />
              <span className='relative inline-flex size-1.5 rounded-full bg-[#0A67F5]' />
            </span>
            {t('Unified AI access')}
          </div>

          <h1 className='landing-animate-fade-up text-[clamp(3rem,6.8vw,6.5rem)] leading-[0.92] font-semibold tracking-[-0.06em] text-[#08234A] opacity-0 [animation-delay:60ms]'>
            {props.title ? (
              props.title
            ) : (
              <>
                <span className='block'>{t('AI,')}</span>
                <span className='block'>{t('made simple.')}</span>
              </>
            )}
          </h1>

          <p className='landing-animate-fade-up mt-7 max-w-lg text-[15px] leading-7 text-[#49617F] opacity-0 [animation-delay:120ms] md:text-base'>
            {props.description ||
              t(
                'Connect the models you need through one clean, compatible API. Less setup, less switching, more creating.'
              )}
          </p>

          <div className='landing-animate-fade-up mt-9 flex flex-wrap items-center gap-3 opacity-0 [animation-delay:180ms]'>
            <Button
              size='lg'
              className='h-11 rounded-full bg-[#0969ED] px-5 text-white shadow-[0_12px_30px_-12px_rgba(0,87,255,0.7)] hover:bg-[#075DCE]'
              render={
                <Link to={props.isAuthenticated ? '/dashboard' : '/sign-up'} />
              }
            >
              {props.isAuthenticated ? t('Go to Dashboard') : t('Get Started')}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                data-icon='inline-end'
                strokeWidth={2}
              />
            </Button>
          </div>
        </div>

        <div className='landing-animate-fade-in relative opacity-0 [animation-delay:180ms] lg:-mr-10'>
          <EasyBlueprint label={t('Simple and easy')} />
        </div>
      </div>
    </section>
  )
}

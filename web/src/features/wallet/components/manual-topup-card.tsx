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
import { Store } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'

interface ManualTopupCardProps {
  xianyuLink: string
}

export function ManualTopupCard(props: ManualTopupCardProps) {
  const { t } = useTranslation()

  return (
    <Card size='sm' data-card-hover='false'>
      <CardHeader>
        <div className='flex items-start gap-3'>
          <IconBadge tone='warning'>
            <Store />
          </IconBadge>
          <div className='flex min-w-0 flex-col gap-1'>
            <CardTitle>{t('Xianyu Trading')}</CardTitle>
            <CardDescription>
              {t(
                'Online topup is not enabled. Please trade on Xianyu or use a redemption code below.'
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <figure className='bg-background mx-auto flex flex-col items-center rounded-lg border p-3 sm:mx-0'>
          <QRCodeSVG
            value={props.xianyuLink}
            size={168}
            level='M'
            includeMargin
            title={t('Xianyu QR code')}
          />
          <figcaption className='text-muted-foreground mt-2 text-center text-xs'>
            {t('Please scan with Xianyu')}
          </figcaption>
        </figure>
        <figure className='bg-background mx-auto flex flex-col items-center rounded-lg border p-3 sm:mx-0'>
          <div className='flex size-[168px] items-center justify-center overflow-hidden bg-white'>
            <img
              src='/wechat.png'
              alt={t('WeChat support QR code')}
              className='max-h-full max-w-full object-contain'
            />
          </div>
          <figcaption className='text-muted-foreground mt-2 text-center text-xs'>
            {t('WeChat')} · {t('Technical Support')}
          </figcaption>
        </figure>
      </CardContent>
    </Card>
  )
}

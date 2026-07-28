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
import { parsePlainHomeHero } from './custom-home-content-parser'
import { Hero } from './hero'

interface CustomHomeContentProps {
  content: string
  isAuthenticated?: boolean
}

export function CustomHomeContent(props: CustomHomeContentProps) {
  const lines = parsePlainHomeHero(props.content)

  if (!lines) {
    return null
  }

  return (
    <Hero
      title={lines.length > 1 ? lines[0] : undefined}
      description={lines.slice(1).join(' ')}
      isAuthenticated={props.isAuthenticated}
    />
  )
}

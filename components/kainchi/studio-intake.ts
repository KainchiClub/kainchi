export const STUDIO_INTAKE_EVENT = 'kainchi:studio-intake'

export type StudioIntakeItem = {
  productName: string
  garment: string
  color: string
  size: string
  price: number
}

export type StudioIntakeRequest = {
  directUrl?: string
  items?: StudioIntakeItem[]
}

export function requestStudioIntake(request: StudioIntakeRequest) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent<StudioIntakeRequest>(STUDIO_INTAKE_EVENT, { detail: request }))
}

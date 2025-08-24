'use client'

import { Address } from '@/app/lib/types'

interface AddressCardProps {
  title: string
  address: Address
}

export default function AddressCard({ title, address }: AddressCardProps) {
  return (
    <div className="bg-white rounded-lg border border-warm-beige p-6">
      <h3 className="font-satoshi font-semibold text-lg text-matte-black mb-4">
        {title}
      </h3>
      
      <div className="text-slate-gray space-y-1">
        <p className="font-medium text-matte-black">{address.name}</p>
        <p>{address.street}</p>
        <p>
          {address.city}, {address.state} {address.zipCode}
        </p>
        <p>{address.country}</p>
      </div>
    </div>
  )
}
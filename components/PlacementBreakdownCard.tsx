'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PlacementClient {
  id: string
  name: string
  date: string
}

interface PlacementBreakdownCardProps {
  location: string
  count: number
  clients: PlacementClient[]
}

export default function PlacementBreakdownCard({
  location,
  count,
  clients,
}: PlacementBreakdownCardProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div
        className="flex justify-between items-center bg-green-50 px-4 py-3 rounded-lg cursor-pointer hover:bg-green-100 hover:shadow-md transition-all border-2 border-transparent hover:border-green-200"
        onClick={() => setShowModal(true)}
      >
        <dt className="text-gray-700 font-medium">{location}</dt>
        <dd className="font-bold text-green-600 text-lg flex items-center gap-2">
          {count}
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </dd>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="bg-green-100 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <h3 className="text-xl font-bold text-green-700">{location}</h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowModal(false)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-green-600 mt-1">{count} client{count !== 1 ? 's' : ''} placed</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <h4 className="font-semibold text-gray-700 mb-3">Clients Placed at {location}</h4>
              {clients.length > 0 ? (
                <div className="space-y-2">
                  {clients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/client/${client.id}`}
                      className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg hover:bg-green-50 hover:shadow transition-all border border-transparent hover:border-green-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        {client.name}
                      </span>
                      <span className="text-sm text-gray-500">{client.date}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No client details available</p>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowModal(false)
                }}
                className="w-full py-2 px-4 rounded-lg bg-green-100 text-green-700 font-medium hover:bg-green-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

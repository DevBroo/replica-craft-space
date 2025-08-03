import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const BookingDetails: React.FC = () => {
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/login" className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer">
              <i className="fas fa-arrow-left mr-2"></i>
              <span className="text-sm font-medium">Back</span>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Booking Details</h1>
            <button className="text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap">
              <i className="fas fa-share-alt"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-32">
        {/* Hotel Banner */}
        <div className="relative h-64 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1440&h=256&fit=crop&crop=center"
            alt="Grand Palace Hotel"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          {/* Hotel Information Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Grand Palace Hotel</h2>
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400 mr-2">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                    </div>
                    <span className="text-sm text-gray-600">5.0 (2,847 reviews)</span>
                  </div>
                  <p className="text-gray-600 flex items-center">
                    <i className="fas fa-map-marker-alt mr-2 text-red-500"></i>
                    123 Fifth Avenue, Downtown, New York, NY 10001
                  </p>
                </div>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 cursor-pointer whitespace-nowrap">
                  <i className="fas fa-hotel mr-2"></i>
                  View Hotel
                </button>
              </div>
            </div>
          </div>

          {/* Booking Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <i className="fas fa-check-circle mr-2"></i>
                    Confirmed
                  </span>
                  <p className="text-sm text-gray-600 mt-2">Booking Reference: <span className="font-semibold text-gray-900">#GPH-2024-001234</span></p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                    <i className="fas fa-qrcode text-2xl text-gray-400"></i>
                  </div>
                  <p className="text-xs text-gray-500">QR Check-in</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stay Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Stay Details</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-calendar-check text-green-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-semibold text-gray-900">December 25, 2024</p>
                      <p className="text-sm text-gray-600">After 3:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-calendar-times text-red-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-out</p>
                      <p className="font-semibold text-gray-900">December 27, 2024</p>
                      <p className="text-sm text-gray-600">Before 11:00 AM</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-clock text-blue-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900">2 nights</p>
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-users text-purple-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Guests</p>
                      <p className="font-semibold text-gray-900">2 adults</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center">
                  <img
                    src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=80&h=80&fit=crop&crop=center"
                    alt="Deluxe Suite"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">Deluxe Suite</h4>
                    <p className="text-sm text-gray-600">King Bed • City View • 45 sqm</p>
                    <p className="text-sm text-gray-500">Non-smoking room</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Price Breakdown</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room rate (2 nights)</span>
                  <span className="text-gray-900">$398.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & fees</span>
                  <span className="text-gray-900">$67.30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service charge</span>
                  <span className="text-gray-900">$23.70</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900">$489.00</span>
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  <span className="text-sm text-green-600 font-medium">Payment Completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Room Amenities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Room Amenities</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <i className="fas fa-wifi text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Free WiFi</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-snowflake text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Air Conditioning</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-tv text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Smart TV</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-coffee text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Coffee Machine</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-bath text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Private Bathroom</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-concierge-bell text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Room Service</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-dumbbell text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Fitness Center</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-swimming-pool text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Swimming Pool</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-spa text-blue-500 mr-3"></i>
                  <span className="text-sm text-gray-700">Spa Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Policies</h3>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Check-in/Check-out Policy</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check-in: 3:00 PM - 12:00 AM</li>
                  <li>• Check-out: 6:00 AM - 11:00 AM</li>
                  <li>• Early check-in and late check-out available upon request</li>
                  <li>• Valid photo ID required at check-in</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Cancellation Policy</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Free cancellation until 48 hours before check-in</li>
                  <li>• Cancellations within 48 hours: 50% charge</li>
                  <li>• No-show: Full charge</li>
                  <li>• Refunds processed within 5-7 business days</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">House Rules</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• No smoking in rooms (designated areas available)</li>
                  <li>• Pets not allowed</li>
                  <li>• Quiet hours: 10:00 PM - 7:00 AM</li>
                  <li>• Maximum occupancy: 2 guests per room</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-phone text-green-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Hotel Reception</p>
                    <p className="text-sm text-gray-600">+1 (212) 555-0123</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-envelope text-blue-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email Support</p>
                    <p className="text-sm text-gray-600">reservations@grandpalacehotel.com</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-exclamation-triangle text-red-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Emergency Contact</p>
                    <p className="text-sm text-gray-600">+1 (212) 555-0199 (24/7)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setShowModifyModal(true)}
            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
          >
            <i className="fas fa-edit mr-2"></i>
            Modify Booking
          </button>
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 cursor-pointer whitespace-nowrap"
          >
            <i className="fas fa-times mr-2"></i>
            Cancel Booking
          </button>
        </div>
      </div>

      {/* Modify Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <i className="fas fa-edit text-4xl text-blue-500 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Modify Booking</h3>
              <p className="text-sm text-gray-600">What would you like to change?</p>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <i className="fas fa-calendar mr-3 text-blue-500"></i>
                Change Dates
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <i className="fas fa-users mr-3 text-blue-500"></i>
                Change Guests
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <i className="fas fa-bed mr-3 text-blue-500"></i>
                Change Room Type
              </button>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowModifyModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 cursor-pointer whitespace-nowrap">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Booking</h3>
              <p className="text-sm text-gray-600">Are you sure you want to cancel this booking?</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">
                <i className="fas fa-info-circle mr-2"></i>
                Cancellation within 48 hours will incur a 50% charge ($244.50)
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 cursor-pointer whitespace-nowrap"
              >
                Keep Booking
              </button>
              <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 cursor-pointer whitespace-nowrap">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;
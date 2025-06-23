"use client"

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { RentalRequestService } from "@/services/rental-requests";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNotify } from '@/hooks/useNotify';
import { Calendar, MapPin, Wrench, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Suspense } from "react"
import { Metadata } from "next"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

export default function RequestsPage() {
  const [equipment, setEquipment] = useState("");
  const [fleet, setFleet] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fleetLoading, setFleetLoading] = useState(true);

  const notify = useNotify();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Use enhanced service to fetch fleet data
    setFleetLoading(true);
    RentalRequestService.fetchFleet().then(({ data, error }) => {
      if (error) {
        console.error('Fleet loading error:', error);
        notify.error('Failed to load equipment list');
      } else {
        console.log('Fleet loaded:', data);
        setFleet(data || []);
      }
      setFleetLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', { equipment, startDate, endDate, location, notes });
    
    setLoading(true);
    
    try {
      // Test toast immediately
      notify.info('Starting request submission...');
      
      const user = (await getSupabaseClient().auth.getUser()).data.user;
      if (!user) {
        notify.error("You must be logged in to submit a request.");
        return;
      }

      console.log('User authenticated:', user.id);

      // Validate dates - allow today's date
      const startDateObj = new Date(startDate);
      const todayObj = new Date();
      todayObj.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (startDateObj < todayObj) {
        notify.error("Start date cannot be in the past.");
        return;
      }

      if (new Date(endDate) <= new Date(startDate)) {
        notify.error("End date must be after start date.");
        return;
      }

      // Show loading toast
      const loadingToast = notify.loading("Submitting your request...");
      console.log('Loading toast shown');

      const requestData = {
        equipment_id: equipment,
        start_date: startDate,
        end_date: endDate,
        project_location: location,
        notes: notes || undefined,
      };

      console.log('Calling createRequest with:', requestData);
      
      const result = await RentalRequestService.createRequest(requestData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log('Request created successfully:', result.data);

      // Dismiss loading toast and show success
      notify.dismiss(loadingToast);
      notify.success("Request submitted successfully!", {
        description: "Your rental request has been submitted and is pending approval.",
      });

      console.log('Success toast shown');

      // Reset form
      setEquipment("");
      setStartDate("");
      setEndDate("");
      setLocation("");
      setNotes("");
      
      // Show success message
      notify.success("Form reset successfully!", {
        description: "You can submit another request if needed.",
      });
      
    } catch (error) {
      console.error('Request submission error:', error);
      notify.error(error instanceof Error ? error.message : 'Failed to submit request', {
        description: "Please try again or contact support if the problem persists.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEquipment(e.target.value);
    if (e.target.value) {
      const selectedEquipment = fleet.find(item => item.id === e.target.value);
      if (selectedEquipment) {
        notify.info(`Selected: ${selectedEquipment.name}`, {
          description: `Status: ${selectedEquipment.status}`,
        });
      }
    }
  };

  const selectedEquipment = fleet.find(item => item.id === equipment);
  const isFormValid = equipment && startDate && endDate && location;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Wrench className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment Rental Request</h1>
          <p className="text-gray-600 text-lg">Submit a request for equipment rental</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-white font-semibold text-lg">Request Details</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Equipment Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Wrench className="w-4 h-4" />
                Equipment
              </label>
              <div className="relative">
                <select
                  className={`w-full border rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none text-gray-900 required:invalid:text-gray-400 ${
                    equipment ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                  value={equipment}
                  onChange={handleEquipmentChange}
                  required
                  disabled={fleetLoading}
                >
                  <option value="" disabled hidden>{fleetLoading ? "Loading equipment..." : "Select Equipment"}</option>
                  {fleet.map(item => (
                    <option 
                      key={item.id} 
                      value={item.id} 
                      disabled={item.status !== "Available"}
                      className="text-gray-900"
                    >
                      {`${item.name}${item.status !== "Available" ? ` (${item.status})` : ""}`}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {fleetLoading && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-blue-700">Loading available equipment...</span>
                </div>
              )}
              {selectedEquipment && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{selectedEquipment.name}</p>
                    <p className="text-sm text-green-700">Status: {selectedEquipment.status}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  required 
                  min={today}
                  className={`p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 ${
                    startDate ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4" />
                  End Date
                </label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  required 
                  min={startDate || today}
                  className={`p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 ${
                    endDate ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="w-4 h-4" />
                Project Location
              </label>
              <Input
                type="text"
                placeholder="Enter project location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
                className={`p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 ${
                  location ? 'border-green-300 bg-green-50' : 'border-gray-200'
                }`}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4" />
                Additional Notes
              </label>
              <Textarea
                placeholder="Any additional information about your request..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="p-4 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[120px] resize-none text-gray-700 placeholder:text-gray-400"
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className={`w-full p-4 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl ${
                isFormValid 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={loading || fleetLoading || !isFormValid}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Submitting Request...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Submit Request
                </div>
              )}
            </Button>

            {/* Info Section */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-800 mb-1">What happens next?</p>
                  <ul className="space-y-1">
                    <li>• Your request will be reviewed by an administrator</li>
                    <li>• You'll receive a notification once it's approved or declined</li>
                    <li>• Approved requests will automatically reserve the equipment</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
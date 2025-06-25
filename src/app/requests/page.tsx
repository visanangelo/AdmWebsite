"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/features/shared";
import { RentalRequestService } from "@/features/rental-requests";
import { Input } from "@/features/shared/components/ui/input";
import { Textarea } from "@/features/shared/components/ui/textarea";
import { Button } from "@/features/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/shared/components/ui/card";
import { Badge } from "@/features/shared/components/ui/badge";
import { useNotify } from '@/features/shared';
import { Calendar, MapPin, Wrench, Clock, CheckCircle, AlertCircle, ChevronLeft, Info, CalendarDays, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

export default function RequestsPage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState("");
  const [fleet, setFleet] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

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

      // Show success state
      setShowSuccess(true);
      
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

  const resetForm = () => {
    setEquipment("");
    setStartDate("");
    setEndDate("");
    setLocation("");
    setNotes("");
    setStep(1);
    setShowSuccess(false);
  };

  const goToHome = () => {
    router.push('/');
  };

  const selectedEquipment = fleet.find(item => item.id === equipment);
  const isFormValid = equipment && startDate && endDate && location;

  // Calculate rental duration
  const getRentalDuration = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Your equipment rental request has been submitted successfully and is pending approval.
              </p>
              <div className="space-y-3">
                <Button onClick={resetForm} className="w-full">
                  Submit Another Request
                </Button>
                <Button variant="outline" onClick={goToHome} className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Wrench className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Equipment Rental Request</h1>
          <p className="text-gray-600 text-lg">Submit a request for equipment rental</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Equipment</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Details</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Step {step}: {step === 1 ? 'Select Equipment' : 'Request Details'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Equipment Selection */}
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Wrench className="w-4 h-4" />
                          Select Equipment
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
                            <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                            <span className="text-sm text-blue-700">Loading available equipment...</span>
                          </div>
                        )}
                        
                        {selectedEquipment && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-green-50 rounded-lg border border-green-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-green-800">{selectedEquipment.name}</h3>
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                {selectedEquipment.status}
                              </Badge>
                            </div>
                            {selectedEquipment.description && (
                              <p className="text-sm text-green-700">{selectedEquipment.description}</p>
                            )}
                          </motion.div>
                        )}
                      </div>
                      
                      <Button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!equipment}
                        className="w-full h-12 text-lg font-medium"
                      >
                        Continue to Details
                        <ChevronLeft className="w-5 h-5 ml-2 rotate-180" />
                      </Button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Selected Equipment Summary */}
                      {selectedEquipment && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-blue-800">{selectedEquipment.name}</h3>
                              <p className="text-sm text-blue-600">Selected Equipment</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setStep(1)}
                              className="text-blue-600 border-blue-300"
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                      )}

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
                            onChange={(e) => setStartDate(e.target.value)}
                            min={today}
                            required
                            className="h-12"
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
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || today}
                            required
                            className="h-12"
                          />
                        </div>
                      </div>

                      {/* Rental Duration */}
                      {startDate && endDate && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Rental Duration:</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {getRentalDuration()} day{getRentalDuration() !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {/* Location */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <MapPin className="w-4 h-4" />
                          Project Location
                        </label>
                        <Input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Enter project location"
                          required
                          className="h-12"
                        />
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Info className="w-4 h-4" />
                          Additional Notes (Optional)
                        </label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any additional information about your request..."
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="flex-1 h-12"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={!isFormValid || loading}
                          className="flex-1 h-12 text-lg font-medium"
                        >
                          {loading ? (
                            <>
                              <Clock className="w-5 h-5 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Submit Request
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
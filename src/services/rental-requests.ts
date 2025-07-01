import { getSupabaseClient } from '@/lib/supabaseClient'
import { RentalRequest, RentalRequestFilters, CreateRequestData } from '@/types/rental'
import { validateRequiredFields, validateDateRange } from '@/lib/validation'

// Cache management with separate timestamps for better performance
let requestsCache: RentalRequest[] | null = null
let fleetCache: any[] | null = null
let statsCache: any | null = null
let requestsCacheTimestamp = 0
let fleetCacheTimestamp = 0
let statsCacheTimestamp = 0
const CACHE_DURATION = 30000 // 30 seconds

class RentalRequestService {
  static clearCache() {
    requestsCache = null
    fleetCache = null
    statsCache = null
    requestsCacheTimestamp = 0
    fleetCacheTimestamp = 0
    statsCacheTimestamp = 0
  }

  static clearRequestsCache() {
    requestsCache = null
    requestsCacheTimestamp = 0
  }

  static clearFleetCache() {
    fleetCache = null
    fleetCacheTimestamp = 0
  }

  static clearStatsCache() {
    statsCache = null
    statsCacheTimestamp = 0
  }

  static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_DURATION
  }

  static async fetchRequests(
    page: number = 1,
    pageSize: number = 10,
    filters?: RentalRequestFilters
  ): Promise<{ data: RentalRequest[]; total: number; error?: string }> {
    try {
      // Return cached data if valid
      if (requestsCache && this.isCacheValid(requestsCacheTimestamp)) {
        return { data: requestsCache, total: requestsCache.length, error: undefined }
      }

      let query = getSupabaseClient()
        .from("rental_requests")
        .select("id, user_id, equipment_id, start_date, end_date, project_location, notes, status, created_at, equipment:rental_requests_equipment_id_fkey(name, status)", { count: 'exact' })

      // Apply filters
      if (filters?.status && filters.status !== ('all' as any)) {
        query = query.eq('status', filters.status as import('../types/rental').RentalRequestStatus)
      }
      
      if (filters?.equipment && filters.equipment !== 'all') {
        query = query.eq('equipment_id', filters.equipment)
      }
      
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }
      
      if (filters?.search) {
        query = query.or(`user_id.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
      }

      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) {
        console.error('Error fetching requests:', error)
        return { data: [], total: 0, error: error.message }
      }

      // Transform data to match expected format
      const transformedData: RentalRequest[] = (data || []).map((r: any) => {
        const equipmentData = Array.isArray(r.equipment) ? r.equipment[0] : r.equipment
        return {
          id: r.id as string,
          user_id: r.user_id as string,
          equipment_id: r.equipment_id as string,
          start_date: r.start_date as string,
          end_date: r.end_date as string,
          project_location: r.project_location as string,
          notes: r.notes as string,
          status: r.status as import('../types/rental').RentalRequestStatus,
          created_at: r.created_at as string,
          equipment: equipmentData?.name || 'Unknown',
          requester: r.user_id as string,
          date: r.created_at as string,
        }
      })

      // Update cache
      requestsCache = transformedData
      requestsCacheTimestamp = Date.now()

      const result = {
        data: transformedData,
        total: count || 0
      }

      return result
    } catch (error) {
      console.error('Unexpected error fetching requests:', error)
      return {
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch requests'
      }
    }
  }

  static async fetchFleet(): Promise<{ data: any[]; error?: string }> {
    try {
      // Return cached data if valid
      if (fleetCache && this.isCacheValid(fleetCacheTimestamp)) {
        return { data: fleetCache }
      }

      const { data, error } = await getSupabaseClient()
        .from("fleet")
        .select("*")
        .order("name")

      if (error) {
        console.error('Error fetching fleet:', error)
        return { data: [], error: error.message }
      }

      // Update cache
      fleetCache = data || []
      fleetCacheTimestamp = Date.now()

      return { data: data || [] }
    } catch (error) {
      console.error('Unexpected error fetching fleet:', error)
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch fleet'
      }
    }
  }

  static async fetchDashboardStats(): Promise<{ data: any; error?: string }> {
    try {
      // Return cached data if valid
      if (statsCache && this.isCacheValid(statsCacheTimestamp)) {
        return { data: statsCache }
      }

      const today = new Date().toISOString().slice(0, 10)

      // Get all requests and fleet for calculations
      const { data: requests } = await getSupabaseClient()
        .from("rental_requests")
        .select("*")

      const { data: fleet } = await getSupabaseClient()
        .from("fleet")
        .select("*")

      const requestsData = requests || []
      const fleetData = fleet || []

      // Calculate stats
      const activeRentals = requestsData.filter((r: any) => 
        r.status === "Approved" && 
        (r.start_date as string) <= today && 
        (r.end_date as string) >= today
      ).length

      const fleetAvailable = fleetData.filter(f => f.status === "Available").length
      const fleetInUse = fleetData.filter(f => f.status === "In Use").length
      const pendingRequests = requestsData.filter(r => r.status === "Pending").length

      const stats = {
        activeRentals,
        fleetAvailable,
        fleetInUse,
        pendingRequests,
        totalFleet: fleetData.length,
        totalRequests: requestsData.length,
      }

      // Update cache
      statsCache = stats
      statsCacheTimestamp = Date.now()

      return { data: stats }
    } catch (error) {
      console.error('Unexpected error fetching stats:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
      }
    }
  }

  static async approveRequest(id: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("rental_requests")
      .update({ status: "Approved" })
      .eq("id", id)
    
    if (error) throw new Error(error.message)
    
    // Only invalidate related caches
    this.clearRequestsCache()
    this.clearStatsCache()
  }

  static async declineRequest(id: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("rental_requests")
      .update({ status: "Declined" })
      .eq("id", id)
    
    if (error) throw new Error(error.message)
    
    this.clearRequestsCache()
    this.clearStatsCache()
  }

  static async deleteRequest(id: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("rental_requests")
      .delete()
      .eq("id", id)
    
    if (error) throw new Error(error.message)
    
    this.clearRequestsCache()
    this.clearStatsCache()
  }

  static async completeRequest(id: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("rental_requests")
      .update({ status: "Completed" })
      .eq("id", id)
    
    if (error) throw new Error(error.message)
    
    this.clearRequestsCache()
    this.clearStatsCache()
  }

  static async cancelRequest(id: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("rental_requests")
      .update({ status: "Cancelled" })
      .eq("id", id)
    
    if (error) throw new Error(error.message)
    
    this.clearRequestsCache()
    this.clearStatsCache()
  }

  static async reopenRequest(id: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("rental_requests")
      .update({ status: "Pending" })
      .eq("id", id)
    
    if (error) throw new Error(error.message)
    
    this.clearRequestsCache()
    this.clearStatsCache()
  }

  static async updateFleetStatus(id: string, status: import('../types/rental').FleetStatus): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("fleet")
      .update({ status })
      .eq("id", id)
    
    if (error) throw new Error(error.message)
    
    this.clearFleetCache()
    this.clearStatsCache()
  }

  static async createRequest(requestData: CreateRequestData): Promise<{ data: RentalRequest | null; error: string | null }> {
    try {
      const user = (await getSupabaseClient().auth.getUser()).data.user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate request data
      const requiredError = validateRequiredFields(requestData);
      if (requiredError) {
        throw new Error(requiredError);
      }
      const dateError = validateDateRange(requestData.start_date, requestData.end_date);
      if (dateError) {
        throw new Error(dateError);
      }

      // Check for date conflicts
      const { data: existingRequests } = await getSupabaseClient()
        .from('rental_requests')
        .select('*')
        .eq('equipment_id', requestData.equipment_id)
        .eq('status', 'Approved');

      const hasConflict = existingRequests?.some((req: any) => {
        const reqStart = new Date(req.start_date as string);
        const reqEnd = new Date(req.end_date as string);
        const newStart = new Date(requestData.start_date);
        const newEnd = new Date(requestData.end_date);
        
        return (newStart <= reqEnd && newEnd >= reqStart);
      });

      if (hasConflict) {
        throw new Error('This equipment is already reserved for the selected dates');
      }

      const { data, error } = await getSupabaseClient()
        .from('rental_requests')
        .insert([{
          ...requestData,
          user_id: user.id,
          status: 'Pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating request:', error);
        throw new Error(error.message);
      }

      // Clear cache to ensure fresh data
      this.clearCache();

      return { data: data as unknown as RentalRequest, error: null };
    } catch (error) {
      console.error('Unexpected error creating request:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create request' };
    }
  }

  static getOptimisticUpdate(action: string, id: string, currentData: RentalRequest[]): RentalRequest[] {
    switch (action) {
      case 'Approve':
        return currentData.map(item => 
          item.id === id ? { ...item, status: "Approved" } : item
        )
      case 'Decline':
        return currentData.map(item => 
          item.id === id ? { ...item, status: "Declined" } : item
        )
      case 'Complete':
        return currentData.map(item => 
          item.id === id ? { ...item, status: "Completed" } : item
        )
      case 'Cancel':
        return currentData.map(item => 
          item.id === id ? { ...item, status: "Cancelled" } : item
        )
      case 'Reopen':
        return currentData.map(item => 
          item.id === id ? { ...item, status: "Pending" } : item
        )
      case 'Delete':
        return currentData.filter(item => item.id !== id)
      default:
        return currentData
    }
  }
}

export { RentalRequestService } 
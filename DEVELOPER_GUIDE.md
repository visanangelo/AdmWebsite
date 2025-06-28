# 🏗️ Rental Management System - Developer Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [Data Flow](#data-flow)
6. [Development Workflow](#development-workflow)
7. [Key Components](#key-components)
8. [State Management](#state-management)
9. [API & Database](#api--database)
10. [Performance Optimizations](#performance-optimizations)
11. [Testing & Debugging](#testing--debugging)
12. [Common Patterns](#common-patterns)

---

## 🎯 System Overview

This is a **rental management system** built for equipment rental companies. It allows users to:
- **Request equipment rentals** with start/end dates and project locations
- **Manage rental requests** (approve, decline, complete, cancel, reopen)
- **Track fleet inventory** and equipment status
- **View real-time dashboard** with statistics and analytics
- **Filter and search** through rental requests and fleet items

### 🎨 Key User Personas
- **Equipment Managers**: Approve/decline requests, manage fleet
- **Project Managers**: Submit rental requests, track equipment
- **Administrators**: Full system access, audit logs

---

## 🏛️ Architecture & Tech Stack

### Frontend Stack
- **Next.js 15** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Framer Motion** for animations
- **React Hook Form** + **Zod** for form handling

### Backend & Database
- **Supabase** (PostgreSQL + Real-time subscriptions)
- **Supabase Auth** for authentication
- **Edge Functions** for serverless operations

### Key Libraries
- **@tanstack/react-table** for data tables
- **Recharts** for data visualization
- **date-fns** for date manipulation
- **Lucide React** for icons

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── dashboard/                # Main dashboard pages
│   │   ├── page.tsx             # Dashboard home
│   │   ├── layout.tsx           # Dashboard layout
│   │   └── tabs/                # Tab components
│   ├── login/                   # Authentication
│   ├── requests/                # Rental requests page
│   └── globals.css              # Global styles
├── features/                    # Feature-based organization
│   ├── auth/                    # Authentication logic
│   ├── dashboard/               # Dashboard components & logic
│   ├── rental-requests/         # Rental requests feature
│   ├── fleet/                   # Fleet management
│   └── shared/                  # Shared utilities & components
└── supabase/                    # Database schema & functions
```

### 🎯 Feature Organization Benefits
- **Code Splitting**: Each feature is a separate bundle
- **Tree Shaking**: Dead code elimination
- **Better Caching**: Feature-based cache invalidation
- **Team Collaboration**: Clear ownership boundaries

---

## 🚀 Core Features

### 1. **Rental Requests Management**
```typescript
// Key interfaces
interface RentalRequest {
  id: string;
  user_id: string;
  equipment_id: string;
  start_date: string;
  end_date: string;
  project_location: string;
  notes: string;
  status: string; // 'Pending', 'Approved', 'Declined', 'Completed', 'Cancelled'
  created_at: string;
  equipment?: { name: string; status: string };
}
```

**Available Actions:**
- ✅ **Approve** → Changes status to 'Approved'
- ❌ **Decline** → Changes status to 'Declined'
- ✅ **Complete** → Changes status to 'Completed'
- ❌ **Cancel** → Changes status to 'Cancelled'
- 🔄 **Reopen** → Changes status back to 'Pending'

### 2. **Fleet Management**
- Track equipment inventory
- Monitor equipment status (Available, In Use, Maintenance)
- Real-time status updates

### 3. **Dashboard Analytics**
- Active rentals count
- Pending requests
- Fleet utilization
- Real-time charts and statistics

---

## 🔄 Data Flow

### 1. **Request Lifecycle**
```
User submits request → Pending status → Manager reviews → Approved/Declined → Equipment assigned → Completed
```

### 2. **Data Fetching Pattern**
```typescript
// 1. Check cache first
if (cache && isCacheValid(cacheTimestamp)) {
  return cachedData;
}

// 2. Fetch from Supabase
const { data, error } = await supabase
  .from('rental_requests')
  .select('*')
  .order('created_at', { ascending: false });

// 3. Transform data
const transformedData = data.map(transformRequest);

// 4. Update cache
updateCache(transformedData);

// 5. Return result
return { data: transformedData, error };
```

### 3. **Real-time Updates**
```typescript
// Subscribe to database changes
const subscription = supabase
  .channel('rental_requests')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'rental_requests' },
    (payload) => {
      // Update local state
      updateRequests(payload);
    }
  )
  .subscribe();
```

---

## 🛠️ Development Workflow

### 1. **Setting Up Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 2. **Adding New Features**
1. **Create feature folder** in `src/features/`
2. **Add components** in `components/` subfolder
3. **Add hooks** in `hooks/` subfolder
4. **Add services** in `services/` subfolder
5. **Export from index.ts** for clean imports

### 3. **Component Structure**
```typescript
// src/features/rental-requests/components/MyComponent.tsx
import React from 'react';
import { useRentalRequests } from '../hooks/use-rental-requests';
import { RentalRequestService } from '../services/rental-requests';

interface MyComponentProps {
  // Define props
}

export const MyComponent: React.FC<MyComponentProps> = ({ ...props }) => {
  // Component logic
  return (
    // JSX
  );
};
```

---

## 🧩 Key Components

### 1. **DataTable Component**
```typescript
// Features:
- Pagination
- Sorting
- Filtering
- Bulk actions
- Mobile responsive
- Loading states
- Error handling

// Usage:
<DataTable
  data={requests}
  onApprove={handleApprove}
  onDecline={handleDecline}
  loading={loading}
  pageSize={10}
  enablePagination={true}
  enableBulkActions={true}
/>
```

### 2. **Dashboard Cards**
```typescript
// Real-time statistics cards with:
- Animated counters
- Trend indicators
- Loading skeletons
- Error states
```

### 3. **Dialog Components**
```typescript
// Consistent dialog pattern:
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      {/* Actions */}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🎛️ State Management

### 1. **Context Pattern**
```typescript
// Dashboard context for shared state
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider component manages:
- Data fetching
- Loading states
- Error handling
- Real-time updates
- Cache management
```

### 2. **Custom Hooks**
```typescript
// Feature-specific hooks
const useRentalRequests = () => {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch data, handle updates, etc.
  
  return { requests, loading, refetch, updateRequest };
};
```

### 3. **Optimistic Updates**
```typescript
// Update UI immediately, then sync with server
const handleApprove = async (id: string) => {
  // Optimistic update
  setRequests(prev => 
    prev.map(req => 
      req.id === id ? { ...req, status: 'Approved' } : req
    )
  );
  
  // Server update
  await RentalRequestService.approveRequest(id);
};
```

---

## 🗄️ API & Database

### 1. **Supabase Tables**
```sql
-- rental_requests table
CREATE TABLE rental_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  equipment_id UUID REFERENCES fleet(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  project_location TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- fleet table
CREATE TABLE fleet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **Service Layer Pattern**
```typescript
class RentalRequestService {
  // Static methods for all CRUD operations
  static async fetchRequests(): Promise<{ data: RentalRequest[], error?: string }>
  static async approveRequest(id: string): Promise<void>
  static async createRequest(data: CreateRequestData): Promise<{ data: RentalRequest | null, error: string | null }>
  
  // Cache management
  static clearCache(): void
  static isCacheValid(timestamp: number): boolean
}
```

### 3. **Error Handling**
```typescript
// Consistent error handling pattern
try {
  const { data, error } = await service.fetchData();
  if (error) {
    throw new Error(error);
  }
  return { data, error: null };
} catch (error) {
  console.error('Operation failed:', error);
  return { 
    data: null, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  };
}
```

---

## ⚡ Performance Optimizations

### 1. **Caching Strategy**
```typescript
// Multi-level caching
const CACHE_DURATION = 30000; // 30 seconds
const STALE_DURATION = 60000; // 1 minute

// Cache invalidation
- On data mutations
- On real-time updates
- Time-based expiration
```

### 2. **Code Splitting**
```typescript
// Lazy load non-critical features
const DashboardTab = lazy(() => import('./tabs/DashboardTab'));
const RequestsTab = lazy(() => import('./tabs/RequestsTab'));

// Suspense boundaries
<Suspense fallback={<Skeleton />}>
  <DashboardTab />
</Suspense>
```

### 3. **Optimistic Updates**
- Update UI immediately
- Sync with server in background
- Rollback on errors

### 4. **Debounced Operations**
```typescript
// Debounce expensive operations
const debouncedFetch = useMemo(
  () => debounce(fetchData, 300),
  [fetchData]
);
```

---

## 🧪 Testing & Debugging

### 1. **Development Tools**
- **React DevTools** for component inspection
- **Supabase Dashboard** for database queries
- **Network tab** for API calls
- **Console logs** for debugging

### 2. **Common Debugging Patterns**
```typescript
// Debug data flow
console.log('Requests:', requests);
console.log('Loading:', loading);
console.log('Error:', error);

// Debug cache
console.log('Cache valid:', RentalRequestService.isCacheValid(timestamp));
console.log('Cache data:', requestsCache);
```

### 3. **Error Boundaries**
```typescript
// Catch and handle errors gracefully
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Show user-friendly error message
  }
}
```

---

## 🔄 Common Patterns

### 1. **Loading States**
```typescript
// Consistent loading pattern
{loading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <Component data={data} />
)}
```

### 2. **Error States**
```typescript
// Error handling pattern
{error ? (
  <div className="text-red-500">
    <AlertCircle className="h-4 w-4" />
    {error}
  </div>
) : (
  // Normal content
)}
```

### 3. **Form Handling**
```typescript
// React Hook Form + Zod pattern
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {
    // Default values
  }
});

const onSubmit = async (data: FormData) => {
  try {
    await service.createRequest(data);
    // Success handling
  } catch (error) {
    // Error handling
  }
};
```

### 4. **Real-time Updates**
```typescript
// Subscribe to changes
useEffect(() => {
  const subscription = supabase
    .channel('table_name')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, 
      (payload) => {
        // Update local state
        updateData(payload);
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

---

## 🚀 Getting Started as a Feature Developer

### 1. **Understand the Domain**
- Read through the type definitions in `src/features/shared/types/`
- Understand the data models and relationships
- Review existing components for patterns

### 2. **Follow the Architecture**
- Use feature-based organization
- Keep components small and focused
- Use the service layer for data operations
- Implement proper error handling

### 3. **Performance First**
- Use caching strategies
- Implement optimistic updates
- Add loading and error states
- Consider mobile responsiveness

### 4. **Testing Your Changes**
- Test on different screen sizes
- Verify real-time updates work
- Check error scenarios
- Ensure accessibility compliance

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Radix UI**: https://www.radix-ui.com/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 🤝 Contributing

1. **Follow the existing patterns**
2. **Add proper TypeScript types**
3. **Include loading and error states**
4. **Test on mobile devices**
5. **Update documentation**

---

*This guide should help you understand and contribute to the rental management system effectively! 🎉* 
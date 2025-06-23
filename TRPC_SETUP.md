# tRPC + Supabase Backend Setup

## 🚀 Overview

This project now uses **tRPC + Supabase** as the backend solution, providing:

- **Type-safe end-to-end** API calls
- **Automatic caching** with React Query
- **Optimistic updates** for better UX
- **Real-time subscriptions** from Supabase
- **Better error handling** and validation

## 📁 File Structure

```
src/
├── server/
│   ├── trpc.ts                 # tRPC server configuration
│   └── routers/
│       ├── index.ts            # Main router
│       └── rental.ts           # Rental requests router
├── lib/
│   ├── trpc.ts                 # tRPC client
│   └── trpc-provider.tsx       # tRPC provider component
├── hooks/
│   └── use-rental-requests.ts  # Custom hook for rental operations
└── app/
    └── api/
        └── trpc/
            └── [trpc]/
                └── route.ts    # tRPC API endpoint
```

## 🔧 Key Components

### 1. tRPC Server (`src/server/trpc.ts`)
- Handles authentication and authorization
- Provides middleware for admin and protected routes
- Configures error handling and validation

### 2. Rental Router (`src/server/routers/rental.ts`)
- Contains all rental-related business logic
- Handles CRUD operations for rental requests
- Manages fleet status updates
- Includes audit logging

### 3. Custom Hook (`src/hooks/use-rental-requests.ts`)
- Provides type-safe access to all rental operations
- Handles caching and optimistic updates
- Manages loading states and error handling

## 🎯 Usage Examples

### Using the Custom Hook

```typescript
import { useRentalRequests } from '@/hooks/use-rental-requests'

function MyComponent() {
  const {
    requests,
    fleet,
    stats,
    isLoading,
    handleApprove,
    handleDecline,
    handleDelete,
    refreshAll,
  } = useRentalRequests()

  // All operations are type-safe and cached
  const handleApproveRequest = async (id: string) => {
    await handleApprove(id) // Optimistic update + server call
  }

  return (
    <div>
      {isLoading ? <Loading /> : <DataTable data={requests} />}
    </div>
  )
}
```

### Direct tRPC Usage

```typescript
import { trpc } from '@/lib/trpc'

function MyComponent() {
  // Query with caching
  const { data: requests, isLoading } = trpc.rental.getRequests.useQuery({
    page: 1,
    pageSize: 10,
    filters: { status: 'Pending' }
  })

  // Mutation with optimistic updates
  const approveMutation = trpc.rental.updateRequestStatus.useMutation({
    onSuccess: () => {
      toast.success('Request approved!')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id, status: 'Approved' })
  }
}
```

## 🔄 Migration Benefits

### Before (Direct Supabase)
```typescript
// ❌ No type safety, manual error handling
const { data, error } = await supabase
  .from("rental_requests")
  .select("*")
  .eq("status", "Pending")

if (error) {
  console.error(error.message)
  return
}
```

### After (tRPC)
```typescript
// ✅ Type-safe, automatic error handling, caching
const { data: requests, error } = trpc.rental.getRequests.useQuery({
  filters: { status: 'Pending' }
})

// Error handling is automatic
// Data is cached and automatically revalidated
// TypeScript provides full intellisense
```

## 🚀 Performance Improvements

### 1. Automatic Caching
- **30-second cache** for rental requests
- **1-minute cache** for fleet data
- **Background revalidation** for fresh data

### 2. Optimistic Updates
- UI updates immediately on user actions
- Server calls happen in background
- Automatic rollback on errors

### 3. Request Batching
- Multiple API calls are batched automatically
- Reduced network overhead
- Better performance

## 🛡️ Security Features

### 1. Authentication Middleware
```typescript
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } })
})
```

### 2. Admin Authorization
```typescript
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  const isAdmin = ctx.session.user.user_metadata?.role === 'admin'
  if (!isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }
  return next({ ctx })
})
```

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Dependencies
```json
{
  "@trpc/client": "^11.0.0",
  "@trpc/server": "^11.0.0",
  "@trpc/react-query": "^11.0.0",
  "@trpc/next": "^11.0.0",
  "@tanstack/react-query": "^5.59.16",
  "superjson": "^2.2.1"
}
```

## 📈 Next Steps

### Phase 1: ✅ Complete
- [x] tRPC server setup
- [x] Rental router implementation
- [x] Custom hook creation
- [x] Dashboard integration

### Phase 2: 🚧 In Progress
- [ ] Add Redis caching layer
- [ ] Implement database indexes
- [ ] Add real-time subscriptions
- [ ] Performance monitoring

### Phase 3: 📋 Planned
- [ ] Add more routers (users, settings, etc.)
- [ ] Implement advanced filtering
- [ ] Add export functionality
- [ ] Mobile app API

## 🐛 Troubleshooting

### Common Issues

1. **TypeScript Errors**: Make sure all dependencies are installed
   ```bash
   npm install
   ```

2. **Authentication Issues**: Check Supabase session in browser dev tools

3. **Caching Issues**: Use `utils.invalidate()` to refresh data
   ```typescript
   const utils = trpc.useUtils()
   utils.rental.getRequests.invalidate()
   ```

4. **Performance Issues**: Check React Query dev tools for cache status

## 📚 Resources

- [tRPC Documentation](https://trpc.io/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) 
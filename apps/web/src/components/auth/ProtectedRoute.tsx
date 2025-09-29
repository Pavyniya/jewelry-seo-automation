import React from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // TEMPORARY: Disable authentication for development
  // const { isAuthenticated, isLoading } = useAuth()
  // const location = useLocation()

  // Show loading spinner while checking authentication
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="flex flex-col items-center space-y-4">
  //         <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   )
  // }

  // // Redirect to login if not authenticated
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" state={{ from: location }} replace />
  // }

  return <>{children}</>
}

export default ProtectedRoute
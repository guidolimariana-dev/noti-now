// src/components/NotFound.tsx
import { Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="text-muted-foreground">The page you are looking for doesn't exist.</p>
      <Button asChild>
        <Link to='/'>Go Home</Link>
      </Button>
    </div>
  )
}

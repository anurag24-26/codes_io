import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Link to="/" className="text-lg font-extrabold tracking-tight text-neutral-900">
            codes<span className="text-brand-600">.io</span>
          </Link>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Create Your Menu</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="container-page flex flex-col items-center justify-between gap-3 text-sm text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Codes.io</p>
          <p>Digital menus, done simply.</p>
        </div>
      </footer>
    </div>
  );
}

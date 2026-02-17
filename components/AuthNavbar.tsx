import { useAuth0 } from '@auth0/auth0-react';
import { LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react';

export const AuthNavbar = () => {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <nav className="flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-md text-white border-b border-slate-700/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          OmniChat Neural Hub
        </h1>
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={18} />
          <span className="text-sm">Loading...</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-md text-white border-b border-slate-700/50">
      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        OmniChat Neural Hub
      </h1>
      
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-full border border-slate-600/50 backdrop-blur-sm">
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name || 'User'} 
                  className="w-6 h-6 rounded-full border border-slate-500" 
                />
              ) : (
                <UserIcon size={18} className="text-slate-400" />
              )}
              <span className="text-sm font-medium text-slate-200">
                {user?.nickname || user?.name || 'User'}
              </span>
            </div>
            <button 
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 transition-all duration-200 px-4 py-2 rounded-md text-red-300 hover:text-red-200"
            >
              <LogOut size={18} /> 
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </>
        ) : (
          <button 
            onClick={() => loginWithRedirect()}
            className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 transition-all duration-200 px-4 py-2 rounded-md text-blue-300 hover:text-blue-200"
          >
            <LogIn size={18} /> 
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
};

import { Navigate, useLocation } from "react-router-dom";
import AllRoutes from "./Routes/AllRoutes";
import Navbar from './components/Navbar'
import { useSelector, useDispatch } from "react-redux";
import useUpdateUserData from "./hooks/useUpdateUserData";
import { useEffect, useState } from "react"; 
import CompanyDashboard from "./Pages/CompanyDashboard";
import { setLoadingFalse } from "./store/authSlice";
import EmailVerificationBanner from "./components/EmailVerificationBanner";

function App() {
  const { loading } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const hideOnRoutes = ["/login", "/signup", "/forgot-password"];
  const updateUser = useUpdateUserData();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await updateUser();
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setInitialLoad(false);
        dispatch(setLoadingFalse());
      }
    };

    initializeAuth();
  }, []);

  // Show loading spinner during initial app load
  if (initialLoad || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div>
        {!(
          hideOnRoutes.includes(location.pathname)
        ) && (
          <>
            <Navbar />
            {/* Fixed, like the navbar it sits below: pages already reserve space for the
                navbar's height individually (mt-16), so this floats above content rather
                than trying to add to that per-page spacing. */}
            <div className="fixed top-16 left-0 right-0 z-40">
              <EmailVerificationBanner />
            </div>
          </>
        )}
        <AllRoutes />
      </div>
    </>
  )
}

export default App

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { setLoadingFalse } from "../store/authSlice";

function PrivateRoutes({ children }) {
  const { userData, loading } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  //
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        dispatch(setLoadingFalse());
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [loading, dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center text-text-secondary h-screen">
        Loading...
      </div>
    );
  }

  if (!userData) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default PrivateRoutes;

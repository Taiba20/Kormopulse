import { useDispatch } from 'react-redux';
import { getCurrentUser } from '../services/userService';
import { updateUser, logout } from '../store/authSlice';

const useUpdateUserData = () => {
  const dispatch = useDispatch();

  const updateUserData = async () => {
    try {
      const response = await getCurrentUser();
      if (response.data && response.data.data && response.data.data.user) {
        dispatch(updateUser(response.data.data.user));
        return response.data.data.user;
      }
    } catch (error) {
      console.error('Failed to update user data', error);
      // If token is invalid, logout the user
      if (error.response?.status === 401 || error.response?.status === 403) {
        dispatch(logout());
      }
      return null;
    }
  };

  return updateUserData;
};

export default useUpdateUserData;
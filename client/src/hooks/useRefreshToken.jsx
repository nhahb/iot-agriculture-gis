import axios from '@/api/axios';
import useAuth from './useAuth';

// const useRefreshToken = () => {
//     const { setAuth } = useAuth();

//     const refresh = async () => {
//         console.log('refresh token call');
//         const response = await axios.get('/refreshToken', {
//             withCredentials: true
//         });
//         setAuth(prev => {
//             return {
//                 ...prev,
//                 role: response.data.role,
//                 accessToken: response.data.accessToken
//             }
//         });
//         return response.data.accessToken;
//     }
//     return refresh;
// };

let refreshPromise = null;

const useRefreshToken = () => {
  const { setAuth } = useAuth();

  const refresh = async () => {
    if (refreshPromise) return refreshPromise;
    
    refreshPromise = (async () => {
      try {
        const response = await axios.get('/refreshToken',{
            withCredentials: true
        });
        setAuth(prev => ({ ...prev, role: response.data.role, accessToken: response.data.accessToken }));
        return response.data.accessToken;
      } finally {
        refreshPromise = null;
      }
    })();
    
    return refreshPromise;
  };
  
  return refresh;
};


export default useRefreshToken;
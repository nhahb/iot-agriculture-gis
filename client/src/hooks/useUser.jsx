import { useState } from 'react'
import useAxiosPrivate from './useAxiosPrivate';

const useUser = () => {
    const axiosPrivate = useAxiosPrivate();
    const [userData, setUserData] = useState(null);
    const getUser = async () => {
        const response = await axiosPrivate.get('/user/account');
        setUserData(response.data.user);
        return response.data.user;
    };

    return { userData, axiosPrivate, setUserData, getUser };
};

export default useUser;
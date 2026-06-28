import { useState } from 'react';
import useAxiosPrivate from '@/hooks/useAxiosPrivate';

const useDevice = () => {
    const axiosPrivate = useAxiosPrivate();
    const [devices, setDevices] = useState([]);

    const createDevice = async (deviceData) => {
        console.log('Creating device with data:', deviceData);
        const response = await axiosPrivate.post("device", deviceData);
        setDevices(prevDevices => [...prevDevices, response.data.device]);
        return response.data.device;
    };

    const fetchDevices = async (fieldId) => {
        if (!fieldId) {
        setDevices([]);
        return [];
        }

        const response = await axiosPrivate.get("/device", {
        params: {
            fieldId,
        },
        });

        const fetchedDevices =
        response.data.devices ?? [];

        setDevices(fetchedDevices);

        console.log(
        "Fetched devices with latest data:",
        fetchedDevices
        );

        return fetchedDevices;
    };


    return { devices, setDevices, createDevice, fetchDevices };
};

export default useDevice;
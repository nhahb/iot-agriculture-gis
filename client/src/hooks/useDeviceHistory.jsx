import { useState } from 'react';
import useAxiosPrivate from './useAxiosPrivate';

const useDeviceHistory = () => {
  const axiosPrivate = useAxiosPrivate();

  const [historyData, setHistoryData] =
    useState([]);

  const [historySummary, setHistorySummary] =
    useState(null);

  const [historyDevice, setHistoryDevice] =
    useState(null);

  const [totalSamples, setTotalSamples] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

const fetchDeviceHistory = async ({
  deviceId,
  range,
  signal
}) => {
  setLoading(true);

  try {
    const response =
      await axiosPrivate.get(
        `/device/${deviceId}/history`,
        {
          params: {
            range
          },
          signal
        }
      );

    setHistoryData(
      response.data.data
    );

    setHistorySummary(
      response.data.summary
    );

    setTotalSamples(
      response.data.totalSamples
    );

    return response.data;
  } finally {
    setLoading(false);
  }
};

  const clearDeviceHistory = () => {
    setHistoryData([]);
    setHistorySummary(null);
    setHistoryDevice(null);
    setTotalSamples(0);
  };

  return {
    historyData,
    historySummary,
    historyDevice,
    totalSamples,
    loading,
    fetchDeviceHistory,
    clearDeviceHistory
  };
};

export default useDeviceHistory;
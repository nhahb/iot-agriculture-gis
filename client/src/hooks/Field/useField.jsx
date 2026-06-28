import { useState } from 'react'
import useAxiosPrivate from '@/hooks/useAxiosPrivate'

const useField = () => {
    const axiosPrivate = useAxiosPrivate();
    const [fields, setFields] = useState([]);

    const fetchFields = async () => {
        const response = await axiosPrivate.get("field");
        setFields(response.data.fields);
    };

    const createField = async (fieldData) => {
        const response = await axiosPrivate.post("field", fieldData);
        setFields(prevFields => [...prevFields, response.data.field]);
        return response.data.fieldData;
    };

    const deleteField = async (fieldId) => {
        await axiosPrivate.delete(`field/${fieldId}`);
        setFields(prevFields => prevFields.filter(field => field.id !== fieldId));
    };

    const updateField = async (fieldId, fieldData) => {
        const response = await axiosPrivate.put(`field/${fieldId}`, fieldData);
        setFields(prevFields => prevFields.map(field => field.id === fieldId ? response.data.field : field));
        return response.data.fieldData;
    };

    return { fields, setFields, createField, deleteField, fetchFields, updateField };
}

export default useField;
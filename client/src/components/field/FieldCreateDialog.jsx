import { toast } from "sonner";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const FieldCreateDialog = ({
    pendingFeature,
    setPendingFeature,
    createField,
    drawRef,
    fieldName,
    setFieldName,
    fieldAddress,
    setFieldAddress
}) => {

    const handleSaveField = async () =>{
    if(!fieldName || !pendingFeature) return;
    try{
      await createField({ name: fieldName, geometry: pendingFeature.geometry, address: fieldAddress });
      setFieldName('');
      setFieldAddress('');
      drawRef.current.delete(pendingFeature.id);
      setPendingFeature(null);
      toast.success('Tạo field thành công');
    } catch (err){
      console.log(err);
      toast.error('Tạo field thất bại');
    }
  };

  const handleCancelField = () => {
    setFieldName('');
    setFieldAddress('');
    drawRef.current.delete(pendingFeature.id);
    setPendingFeature(null);
  };

  return (
    <>
    {
      pendingFeature&&(
      <div
      className='
      absolute
        top-4
        left-1/2
        -translate-x-1/2
        bg-white
        shadow-lg
        rounded-lg
        p-3
        flex gap-2
        z-20
      '
      >
        <p>Đặt tên khu vực</p>
        <Input type="text" value = {fieldName} onChange = {(e)=>setFieldName(e.target.value)}></Input>
        <Input type="text" value = {fieldAddress} onChange = {(e)=>setFieldAddress(e.target.value)} placeholder="Địa chỉ"></Input>
        <Button onClick = {handleSaveField}>Lưu</Button>
        <Button variant='destructive' onClick = {handleCancelField}>Xóa</Button>
      </div>
      )
    }
    </>
  );
};

export default FieldCreateDialog;